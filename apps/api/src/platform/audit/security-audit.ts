import { uuidv7 } from '@ibc/kernel';
import type { Queryable } from '../db/database.js';

export type AuditOutcome = 'success' | 'failure' | 'denied';

export interface SecurityAuditEntry {
  action: string;
  outcome: AuditOutcome;
  actorUserId?: string | null;
  subjectId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  /** Never put secrets, passwords or tokens in details. */
  details?: Record<string, unknown>;
}

/** Appends to the immutable security audit log (`audit.security_events`). */
export async function recordSecurityEvent(db: Queryable, entry: SecurityAuditEntry): Promise<void> {
  await db.query(
    `INSERT INTO audit.security_events
       (id, action, outcome, actor_user_id, subject_id, ip, user_agent, request_id, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      uuidv7(),
      entry.action,
      entry.outcome,
      entry.actorUserId ?? null,
      entry.subjectId ?? null,
      entry.ip ?? null,
      entry.userAgent?.slice(0, 512) ?? null,
      entry.requestId ?? null,
      JSON.stringify(entry.details ?? {}),
    ],
  );
}

/** Counts recent events for a subject; used for DB-backed, multi-instance-safe throttling. */
export async function countRecentSecurityEvents(
  db: Queryable,
  query: { action: string; outcome: AuditOutcome; subjectId: string; windowSeconds: number },
): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT count(*) AS count
       FROM audit.security_events
      WHERE subject_id = $1 AND action = $2 AND outcome = $3
        AND occurred_at > now() - ($4::integer * interval '1 second')`,
    [query.subjectId, query.action, query.outcome, query.windowSeconds],
  );
  return Number(rows[0]?.count ?? 0);
}
