import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '../src/platform/db/database.js';
import { enqueueEmail, relayEmailBatch, type EmailMessage } from '../src/platform/email/email.js';
import { resetDatabase, testConfig } from './helpers.js';

describe('email relay', () => {
  let db: Database;
  beforeAll(async () => {
    db = createDatabase(testConfig());
    await resetDatabase(db);
  });
  beforeEach(() => db.query('DELETE FROM platform.email_outbox'));
  afterAll(() => db.close());

  const message: EmailMessage = {
    to: 'priya@example.com',
    template: 'identity.verify_email',
    locale: 'en',
    subject: 'Verify',
    textBody: 'secret link ibc_ev_xyz',
  };

  it('sends queued emails and purges their bodies', async () => {
    const id = await enqueueEmail(db, message);
    const sent: EmailMessage[] = [];
    const result = await relayEmailBatch(
      db,
      { send: async (m) => (sent.push(m), { messageId: 'ses-1' }) },
      { batchSize: 10, maxAttempts: 3 },
    );
    expect(result).toEqual({ sent: 1, failed: 0, deadLettered: 0 });
    expect(sent[0]).toEqual(message);
    const { rows } = await db.query(
      'SELECT sent_at, text_body, provider_message_id FROM platform.email_outbox WHERE id = $1',
      [id],
    );
    expect(rows[0]).toMatchObject({ text_body: null, provider_message_id: 'ses-1' });
    expect(rows[0]!.sent_at).not.toBeNull();
  });

  it('retries, then dead-letters and purges the body', async () => {
    const id = await enqueueEmail(db, message);
    const failing = { send: () => Promise.reject(new Error('Throttling')) };
    const options = { batchSize: 10, maxAttempts: 2, backoffBaseMs: 0 };
    expect(await relayEmailBatch(db, failing, options)).toEqual({
      sent: 0,
      failed: 1,
      deadLettered: 0,
    });
    expect(await relayEmailBatch(db, failing, options)).toEqual({
      sent: 0,
      failed: 0,
      deadLettered: 1,
    });
    const { rows } = await db.query(
      'SELECT attempts, text_body, dead_lettered_at FROM platform.email_outbox WHERE id = $1',
      [id],
    );
    expect(rows[0]).toMatchObject({ attempts: 2, text_body: null });
    expect(rows[0]!.dead_lettered_at).not.toBeNull();
  });
});
