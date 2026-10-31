import { uuidv7 } from '@ibc/kernel';
import type { Queryable } from '../db/database.js';

/**
 * Versioned domain event envelope. `type` is `<domain>.<aggregate>.<past-tense-verb>`,
 * e.g. `identity.user.created`. Breaking payload changes require a new `version`;
 * consumers must handle every version they subscribe to and be idempotent on `id`.
 */
export interface DomainEvent<P extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: string;
  version: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: P;
  metadata: EventMetadata;
}

export interface EventMetadata {
  requestId?: string;
  actorUserId?: string;
  [key: string]: unknown;
}

export type NewDomainEvent<P extends Record<string, unknown>> = Omit<
  DomainEvent<P>,
  'id' | 'occurredAt'
>;

/** Appends an event to the outbox. Must be called inside the state-changing transaction. */
export async function appendEvent<P extends Record<string, unknown>>(
  tx: Queryable,
  event: NewDomainEvent<P>,
): Promise<DomainEvent<P>> {
  const stored: DomainEvent<P> = { ...event, id: uuidv7(), occurredAt: new Date() };
  await tx.query(
    `INSERT INTO platform.outbox_events
       (id, aggregate_type, aggregate_id, event_type, event_version, payload, metadata, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      stored.id,
      stored.aggregateType,
      stored.aggregateId,
      stored.type,
      stored.version,
      JSON.stringify(stored.payload),
      JSON.stringify(stored.metadata),
      stored.occurredAt,
    ],
  );
  return stored;
}
