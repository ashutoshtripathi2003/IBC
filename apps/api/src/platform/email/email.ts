import { uuidv7 } from '@ibc/kernel';
import type { FastifyBaseLogger } from 'fastify';
import type { Database, Queryable } from '../db/database.js';
import { backoffDelayMs } from '../events/relay.js';

export interface EmailMessage {
  to: string;
  /** Template identifier, kept for observability after the body is purged. */
  template: string;
  locale: string;
  subject: string;
  textBody: string;
}

/** Delivery provider (Amazon SES in production). */
export interface EmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string | null }>;
}

/** Appends an email to the outbox. Call inside the transaction that triggers it. */
export async function enqueueEmail(tx: Queryable, message: EmailMessage): Promise<string> {
  const id = uuidv7();
  await tx.query(
    `INSERT INTO platform.email_outbox (id, to_address, template, locale, subject, text_body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, message.to, message.template, message.locale, message.subject, message.textBody],
  );
  return id;
}

interface EmailRow {
  id: string;
  to_address: string;
  template: string;
  locale: string;
  subject: string;
  text_body: string;
  attempts: number;
}

export interface EmailRelayResult {
  sent: number;
  failed: number;
  deadLettered: number;
}

/** Sends one batch of due emails (at-least-once; several workers may run concurrently). */
export async function relayEmailBatch(
  db: Database,
  transport: EmailTransport,
  options: {
    batchSize: number;
    maxAttempts: number;
    backoffBaseMs?: number;
    backoffMaxMs?: number;
  },
  logger?: FastifyBaseLogger,
): Promise<EmailRelayResult> {
  const baseMs = options.backoffBaseMs ?? 5000;
  const maxMs = options.backoffMaxMs ?? 30 * 60 * 1000;
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<EmailRow>(
      `SELECT id, to_address, template, locale, subject, text_body, attempts
         FROM platform.email_outbox
        WHERE sent_at IS NULL AND dead_lettered_at IS NULL AND next_attempt_at <= now()
        ORDER BY created_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED`,
      [options.batchSize],
    );
    const result: EmailRelayResult = { sent: 0, failed: 0, deadLettered: 0 };
    for (const row of rows) {
      try {
        const { messageId } = await transport.send({
          to: row.to_address,
          template: row.template,
          locale: row.locale,
          subject: row.subject,
          textBody: row.text_body,
        });
        await tx.query(
          `UPDATE platform.email_outbox
              SET sent_at = now(), text_body = NULL, provider_message_id = $2
            WHERE id = $1`,
          [row.id, messageId],
        );
        result.sent += 1;
      } catch (error) {
        const attempts = row.attempts + 1;
        const dead = attempts >= options.maxAttempts;
        const message = error instanceof Error ? error.message : String(error);
        await tx.query(
          `UPDATE platform.email_outbox
              SET attempts = $2,
                  last_error = left($3, 2000),
                  next_attempt_at = now() + ($4::integer * interval '1 millisecond'),
                  dead_lettered_at = CASE WHEN $5 THEN now() ELSE NULL END,
                  text_body = CASE WHEN $5 THEN NULL ELSE text_body END
            WHERE id = $1`,
          [row.id, attempts, message, backoffDelayMs(attempts, baseMs, maxMs), dead],
        );
        if (dead) result.deadLettered += 1;
        else result.failed += 1;
        // Never log the recipient address or body.
        logger?.warn(
          { emailId: row.id, template: row.template, attempts, deadLettered: dead, err: error },
          'email send failed',
        );
      }
    }
    return result;
  });
}
