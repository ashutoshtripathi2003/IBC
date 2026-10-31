import type { FastifyBaseLogger } from 'fastify';
import type { Database } from '../db/database.js';
import type { DomainEvent } from './outbox.js';

/** Destination for outbox events (Kafka in the target architecture). */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

/** Development publisher: writes events to the structured log. */
export function createLogPublisher(logger: FastifyBaseLogger): EventPublisher {
  return {
    publish: async (event) => {
      logger.info(
        { event: { id: event.id, type: event.type, version: event.version } },
        'event published',
      );
    },
  };
}

export interface RelayOptions {
  batchSize: number;
  maxAttempts: number;
  /** Base for exponential backoff between attempts, in milliseconds. */
  backoffBaseMs?: number;
  backoffMaxMs?: number;
}

export interface RelayBatchResult {
  published: number;
  failed: number;
  deadLettered: number;
}

interface OutboxRow {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  event_version: number;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  occurred_at: Date;
  attempts: number;
}

export function backoffDelayMs(attempts: number, baseMs: number, maxMs: number): number {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts - 1));
}

/**
 * Claims one batch of due events with `FOR UPDATE SKIP LOCKED` (so several relay
 * instances can run concurrently), publishes them, and records the outcome.
 * Delivery is at-least-once; consumers deduplicate on event id.
 */
export async function relayOutboxBatch(
  db: Database,
  publisher: EventPublisher,
  options: RelayOptions,
  logger?: FastifyBaseLogger,
): Promise<RelayBatchResult> {
  const baseMs = options.backoffBaseMs ?? 1000;
  const maxMs = options.backoffMaxMs ?? 15 * 60 * 1000;
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<OutboxRow>(
      `SELECT id, aggregate_type, aggregate_id, event_type, event_version, payload, metadata,
              occurred_at, attempts
         FROM platform.outbox_events
        WHERE published_at IS NULL AND dead_lettered_at IS NULL AND next_attempt_at <= now()
        ORDER BY occurred_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED`,
      [options.batchSize],
    );
    const result: RelayBatchResult = { published: 0, failed: 0, deadLettered: 0 };
    for (const row of rows) {
      const event: DomainEvent = {
        id: row.id,
        type: row.event_type,
        version: row.event_version,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        occurredAt: row.occurred_at,
        payload: row.payload,
        metadata: row.metadata,
      };
      try {
        await publisher.publish(event);
        await tx.query('UPDATE platform.outbox_events SET published_at = now() WHERE id = $1', [
          row.id,
        ]);
        result.published += 1;
      } catch (error) {
        const attempts = row.attempts + 1;
        const message = error instanceof Error ? error.message : String(error);
        const dead = attempts >= options.maxAttempts;
        await tx.query(
          `UPDATE platform.outbox_events
              SET attempts = $2,
                  last_error = left($3, 2000),
                  next_attempt_at = now() + ($4::integer * interval '1 millisecond'),
                  dead_lettered_at = CASE WHEN $5 THEN now() ELSE NULL END
            WHERE id = $1`,
          [row.id, attempts, message, backoffDelayMs(attempts, baseMs, maxMs), dead],
        );
        if (dead) result.deadLettered += 1;
        else result.failed += 1;
        logger?.warn(
          { eventId: row.id, eventType: row.event_type, attempts, deadLettered: dead, err: error },
          'event publish failed',
        );
      }
    }
    return result;
  });
}
