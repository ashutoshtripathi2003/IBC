import type { Queryable } from '../../platform/db/database.js';

/** SQL access for the `identity` schema. Only the identity module may import this file. */

export type UserStatus = 'active' | 'suspended' | 'deactivated';

export interface UserRecord {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  displayName: string;
  status: UserStatus;
  locale: string;
  timezone: string;
  countryCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  ip: string | null;
  userAgent: string | null;
}

const USER_COLUMN_NAMES = [
  'id',
  'email',
  'email_verified_at',
  'display_name',
  'status',
  'locale',
  'timezone',
  'country_code',
  'created_at',
  'updated_at',
];

function userColumns(alias?: string): string {
  return USER_COLUMN_NAMES.map((column) => (alias ? `${alias}.${column}` : column)).join(', ');
}

const USER_COLUMNS = userColumns();

interface UserRow {
  id: string;
  email: string;
  email_verified_at: Date | null;
  display_name: string;
  status: UserStatus;
  locale: string;
  timezone: string;
  country_code: string | null;
  created_at: Date;
  updated_at: Date;
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    displayName: row.display_name,
    status: row.status,
    locale: row.locale,
    timezone: row.timezone,
    countryCode: row.country_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const USERS_EMAIL_UNIQUE = 'users_email_normalized_uq';

export async function insertUser(
  db: Queryable,
  user: {
    id: string;
    email: string;
    emailNormalized: string;
    displayName: string;
    locale: string;
    timezone: string;
    countryCode: string | null;
  },
): Promise<UserRecord> {
  const { rows } = await db.query<UserRow>(
    `INSERT INTO identity.users
       (id, email, email_normalized, display_name, locale, timezone, country_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${USER_COLUMNS}`,
    [
      user.id,
      user.email,
      user.emailNormalized,
      user.displayName,
      user.locale,
      user.timezone,
      user.countryCode,
    ],
  );
  return toUser(rows[0]!);
}

export async function insertPasswordCredential(
  db: Queryable,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db.query(
    'INSERT INTO identity.password_credentials (user_id, password_hash) VALUES ($1, $2)',
    [userId, passwordHash],
  );
}

export async function updatePasswordHash(
  db: Queryable,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db.query(
    `UPDATE identity.password_credentials SET password_hash = $2, updated_at = now()
      WHERE user_id = $1`,
    [userId, passwordHash],
  );
}

export async function grantRole(db: Queryable, userId: string, role: string): Promise<void> {
  await db.query(
    `INSERT INTO identity.user_roles (user_id, role) VALUES ($1, $2)
     ON CONFLICT (user_id, role) DO NOTHING`,
    [userId, role],
  );
}

export async function findUserById(db: Queryable, userId: string): Promise<UserRecord | null> {
  const { rows } = await db.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM identity.users WHERE id = $1`,
    [userId],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function findCredentialByEmail(
  db: Queryable,
  emailNormalized: string,
): Promise<{ user: UserRecord; passwordHash: string; passwordUpdatedAt: Date } | null> {
  const { rows } = await db.query<UserRow & { password_hash: string; password_updated_at: Date }>(
    `SELECT ${userColumns('u')}, c.password_hash, c.updated_at AS password_updated_at
       FROM identity.users u
       JOIN identity.password_credentials c ON c.user_id = u.id
      WHERE u.email_normalized = $1`,
    [emailNormalized],
  );
  const row = rows[0];
  return row
    ? {
        user: toUser(row),
        passwordHash: row.password_hash,
        passwordUpdatedAt: row.password_updated_at,
      }
    : null;
}

export async function updateUserProfile(
  db: Queryable,
  userId: string,
  patch: {
    displayName?: string | undefined;
    locale?: string | undefined;
    timezone?: string | undefined;
    countryCode?: string | null | undefined;
  },
): Promise<UserRecord | null> {
  const { rows } = await db.query<UserRow>(
    `UPDATE identity.users SET
        display_name = COALESCE($2, display_name),
        locale       = COALESCE($3, locale),
        timezone     = COALESCE($4, timezone),
        country_code = CASE WHEN $5 THEN $6 ELSE country_code END,
        updated_at   = now()
      WHERE id = $1
      RETURNING ${USER_COLUMNS}`,
    [
      userId,
      patch.displayName ?? null,
      patch.locale ?? null,
      patch.timezone ?? null,
      patch.countryCode !== undefined,
      patch.countryCode ?? null,
    ],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function insertSession(
  db: Queryable,
  session: {
    id: string;
    userId: string;
    tokenHash: Buffer;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO identity.sessions (id, user_id, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      session.id,
      session.userId,
      session.tokenHash,
      session.expiresAt,
      session.ip,
      session.userAgent?.slice(0, 512) ?? null,
    ],
  );
}

/** Resolves an active, unexpired session for an active user, with the user's roles. */
export async function findActiveSessionByTokenHash(
  db: Queryable,
  tokenHash: Buffer,
): Promise<{ sessionId: string; userId: string; lastSeenAt: Date; roles: string[] } | null> {
  const { rows } = await db.query<{
    session_id: string;
    user_id: string;
    last_seen_at: Date;
    roles: string[];
  }>(
    `SELECT s.id AS session_id, s.user_id, s.last_seen_at,
            COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
       FROM identity.sessions s
       JOIN identity.users u ON u.id = s.user_id
       LEFT JOIN identity.user_roles r ON r.user_id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.status = 'active'
      GROUP BY s.id`,
    [tokenHash],
  );
  const row = rows[0];
  return row
    ? {
        sessionId: row.session_id,
        userId: row.user_id,
        lastSeenAt: row.last_seen_at,
        roles: row.roles,
      }
    : null;
}

export async function touchSession(db: Queryable, sessionId: string): Promise<void> {
  await db.query('UPDATE identity.sessions SET last_seen_at = now() WHERE id = $1', [sessionId]);
}

export async function listActiveSessions(db: Queryable, userId: string): Promise<SessionRecord[]> {
  const { rows } = await db.query<{
    id: string;
    created_at: Date;
    expires_at: Date;
    last_seen_at: Date;
    ip: string | null;
    user_agent: string | null;
  }>(
    `SELECT id, created_at, expires_at, last_seen_at, host(ip) AS ip, user_agent
       FROM identity.sessions
      WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 100`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    ip: row.ip,
    userAgent: row.user_agent,
  }));
}

/** Revokes a session only if it belongs to `userId`. Returns false if nothing was revoked. */
export async function revokeSession(
  db: Queryable,
  sessionId: string,
  userId: string,
  reason: string,
): Promise<boolean> {
  const result = await db.query(
    `UPDATE identity.sessions SET revoked_at = now(), revoked_reason = $3
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId, reason],
  );
  return (result.rowCount ?? 0) > 0;
}

export type OneTimeTokenPurpose = 'email_verification' | 'password_reset';

/** Invalidates outstanding tokens so only the most recently issued link works. */
export async function invalidateOneTimeTokens(
  db: Queryable,
  userId: string,
  purpose: OneTimeTokenPurpose,
): Promise<void> {
  await db.query(
    `UPDATE identity.one_time_tokens SET consumed_at = now()
      WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [userId, purpose],
  );
}

export async function insertOneTimeToken(
  db: Queryable,
  token: {
    id: string;
    userId: string;
    purpose: OneTimeTokenPurpose;
    tokenHash: Buffer;
    email: string;
    expiresAt: Date;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO identity.one_time_tokens (id, user_id, purpose, token_hash, email, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [token.id, token.userId, token.purpose, token.tokenHash, token.email, token.expiresAt],
  );
}

export async function countRecentOneTimeTokens(
  db: Queryable,
  userId: string,
  purpose: OneTimeTokenPurpose,
  windowSeconds: number,
): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT count(*) AS count FROM identity.one_time_tokens
      WHERE user_id = $1 AND purpose = $2
        AND created_at > now() - ($3::integer * interval '1 second')`,
    [userId, purpose, windowSeconds],
  );
  return Number(rows[0]?.count ?? 0);
}

/** Atomically consumes a valid token. Returns null if unknown, used, expired or wrong purpose. */
export async function consumeOneTimeToken(
  db: Queryable,
  tokenHash: Buffer,
  purpose: OneTimeTokenPurpose,
): Promise<{ userId: string; email: string } | null> {
  const { rows } = await db.query<{ user_id: string; email: string }>(
    `UPDATE identity.one_time_tokens SET consumed_at = now()
      WHERE token_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
      RETURNING user_id, email`,
    [tokenHash, purpose],
  );
  const row = rows[0];
  return row ? { userId: row.user_id, email: row.email } : null;
}

/** Marks the email verified only if `email` is still the user's current address. */
export async function markEmailVerified(
  db: Queryable,
  userId: string,
  email: string,
): Promise<UserRecord | null> {
  const { rows } = await db.query<UserRow>(
    `UPDATE identity.users
        SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
      WHERE id = $1 AND email = $2
      RETURNING ${USER_COLUMNS}`,
    [userId, email],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function revokeAllSessions(
  db: Queryable,
  userId: string,
  reason: string,
): Promise<number> {
  const result = await db.query(
    `UPDATE identity.sessions SET revoked_at = now(), revoked_reason = $2
      WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason],
  );
  return result.rowCount ?? 0;
}
