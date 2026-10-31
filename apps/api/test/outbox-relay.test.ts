import { uuidv7 } from '@ibc/kernel';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '../src/platform/db/database.js';
import { appendEvent, type DomainEvent } from '../src/platform/events/outbox.js';
import { backoffDelayMs, relayOutboxBatch } from '../src/platform/events/relay.js';
import { resetDatabase, testConfig } from './helpers.js';

describe('outbox relay', () => {
  let db: Database;
  beforeAll(async () => {
    db = createDatabase(testConfig());
    await resetDatabase(db);
  });
  beforeEach(() => db.query('DELETE FROM platform.outbox_events'));
  afterAll(() => db.close());

  const append = (n = 1) =>
    Promise.all(
      Array.from({ length: n }, () =>
        appendEvent(db, {
          type: 'test.thing.happened',
          version: 1,
          aggregateType: 'thing',
          aggregateId: uuidv7(),
          payload: { ok: true },
          metadata: {},
        }),
      ),
    );

  it('publishes pending events once and marks them published', async () => {
    await append(3);
    const published: DomainEvent[] = [];
    const publisher = { publish: async (event: DomainEvent) => void published.push(event) };
    const first = await relayOutboxBatch(db, publisher, { batchSize: 10, maxAttempts: 3 });
    expect(first).toEqual({ published: 3, failed: 0, deadLettered: 0 });
    expect(published[0]).toMatchObject({
      type: 'test.thing.happened',
      version: 1,
      payload: { ok: true },
    });
    const second = await relayOutboxBatch(db, publisher, { batchSize: 10, maxAttempts: 3 });
    expect(second.published).toBe(0);
  });

  it('retries failures with backoff and dead-letters after max attempts', async () => {
    const [event] = await append(1);
    const failing = { publish: async () => Promise.reject(new Error('broker unavailable')) };
    const options = { batchSize: 10, maxAttempts: 2, backoffBaseMs: 0 };

    expect(await relayOutboxBatch(db, failing, options)).toEqual({
      published: 0,
      failed: 1,
      deadLettered: 0,
    });
    expect(await relayOutboxBatch(db, failing, options)).toEqual({
      published: 0,
      failed: 0,
      deadLettered: 1,
    });
    const { rows } = await db.query(
      'SELECT attempts, last_error, dead_lettered_at FROM platform.outbox_events WHERE id = $1',
      [event!.id],
    );
    expect(rows[0]).toMatchObject({ attempts: 2, last_error: 'broker unavailable' });
    expect(rows[0]!.dead_lettered_at).not.toBeNull();
    // Dead-lettered events are not picked up again.
    expect((await relayOutboxBatch(db, failing, options)).failed).toBe(0);
  });

  it('does not retry before the backoff elapses', async () => {
    await append(1);
    const failing = { publish: async () => Promise.reject(new Error('down')) };
    await relayOutboxBatch(db, failing, { batchSize: 10, maxAttempts: 5, backoffBaseMs: 60_000 });
    const result = await relayOutboxBatch(db, failing, { batchSize: 10, maxAttempts: 5 });
    expect(result).toEqual({ published: 0, failed: 0, deadLettered: 0 });
  });

  it('lets concurrent relays share work without double publishing', async () => {
    await append(20);
    const seen: string[] = [];
    const slow = {
      publish: async (event: DomainEvent) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        seen.push(event.id);
      },
    };
    await Promise.all([
      relayOutboxBatch(db, slow, { batchSize: 10, maxAttempts: 3 }),
      relayOutboxBatch(db, slow, { batchSize: 10, maxAttempts: 3 }),
    ]);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(20);
  });

  it('computes capped exponential backoff', () => {
    expect(backoffDelayMs(1, 1000, 60_000)).toBe(1000);
    expect(backoffDelayMs(3, 1000, 60_000)).toBe(4000);
    expect(backoffDelayMs(20, 1000, 60_000)).toBe(60_000);
  });
});
