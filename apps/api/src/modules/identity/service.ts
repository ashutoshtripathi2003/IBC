import { uuidv7 } from '@ibc/kernel';
import type { FastifyBaseLogger } from 'fastify';
import {
  countRecentSecurityEvents,
  recordSecurityEvent,
} from '../../platform/audit/security-audit.js';
import { Roles, type Principal } from '../../platform/authz/authorization.js';
import { isUniqueViolation, type Database } from '../../platform/db/database.js';
import { appendEvent } from '../../platform/events/outbox.js';
import { AppError, Errors } from '../../platform/http/errors.js';
import { IdentityEvents, type UserCreatedV1, type UserProfileUpdatedV1 } from './events.js';
import { hashPassword, needsRehash, verifyPassword } from './password.js';
import * as repo from './repository.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './schemas.js';
import { generateSessionToken, hashSessionToken, isWellFormedSessionToken } from './tokens.js';

export interface IdentityConfig {
  sessionTtlHours: number;
  passwordHashLog2Cost: number;
  /** Failed logins per account within the window before further attempts are refused. */
  maxFailedLoginsPerAccount?: number;
  failedLoginWindowSeconds?: number;
}

/** Network context of the caller, recorded on sessions and in the audit log. */
export interface RequestContext {
  requestId: string;
  ip: string | null;
  userAgent: string | null;
}

export interface IssuedSession {
  id: string;
  token: string;
  expiresAt: Date;
}

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().normalize('NFC').toLowerCase();
}

export function createIdentityService(deps: {
  db: Database;
  config: IdentityConfig;
  logger: FastifyBaseLogger;
}) {
  const { db, config, logger } = deps;
  const maxFailedLogins = config.maxFailedLoginsPerAccount ?? 10;
  const failedLoginWindowSeconds = config.failedLoginWindowSeconds ?? 15 * 60;

  // Verified against when the account does not exist so response time does not
  // reveal whether an email is registered.
  const dummyHashPromise = hashPassword(uuidv7(), config.passwordHashLog2Cost);

  async function issueSession(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0],
    userId: string,
    ctx: RequestContext,
  ): Promise<IssuedSession> {
    const token = generateSessionToken();
    const session = {
      id: uuidv7(),
      token,
      expiresAt: new Date(Date.now() + config.sessionTtlHours * 3600 * 1000),
    };
    await repo.insertSession(tx, {
      id: session.id,
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: session.expiresAt,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return session;
  }

  function audit(
    entry: Omit<Parameters<typeof recordSecurityEvent>[1], 'ip' | 'userAgent' | 'requestId'>,
    ctx: RequestContext,
  ) {
    return { ...entry, ip: ctx.ip, userAgent: ctx.userAgent, requestId: ctx.requestId };
  }

  return {
    async register(input: RegisterInput, ctx: RequestContext) {
      const passwordHash = await hashPassword(input.password, config.passwordHashLog2Cost);
      try {
        return await db.transaction(async (tx) => {
          const user = await repo.insertUser(tx, {
            id: uuidv7(),
            email: input.email,
            emailNormalized: normalizeEmail(input.email),
            displayName: input.displayName,
            locale: input.locale ?? 'en',
            timezone: input.timezone ?? 'UTC',
            countryCode: input.countryCode ?? null,
          });
          await repo.insertPasswordCredential(tx, user.id, passwordHash);
          await repo.grantRole(tx, user.id, Roles.Member);
          const session = await issueSession(tx, user.id, ctx);
          await appendEvent<UserCreatedV1>(tx, {
            ...IdentityEvents.UserCreated,
            aggregateType: 'user',
            aggregateId: user.id,
            payload: {
              userId: user.id,
              displayName: user.displayName,
              locale: user.locale,
              timezone: user.timezone,
              countryCode: user.countryCode,
            },
            metadata: { requestId: ctx.requestId, actorUserId: user.id },
          });
          await recordSecurityEvent(
            tx,
            audit(
              {
                action: 'identity.register',
                outcome: 'success',
                actorUserId: user.id,
                subjectId: user.id,
              },
              ctx,
            ),
          );
          return { user, session };
        });
      } catch (error) {
        if (isUniqueViolation(error, repo.USERS_EMAIL_UNIQUE)) {
          throw Errors.conflict('email_taken', 'An account with this email already exists.');
        }
        throw error;
      }
    },

    async login(input: LoginInput, ctx: RequestContext) {
      const found = await repo.findCredentialByEmail(db, normalizeEmail(input.email));
      if (!found) {
        await verifyPassword(input.password, await dummyHashPromise);
        await recordSecurityEvent(
          db,
          audit(
            {
              action: 'identity.login',
              outcome: 'failure',
              details: { reason: 'unknown_account' },
            },
            ctx,
          ),
        );
        throw Errors.invalidCredentials();
      }

      const { user, passwordHash } = found;
      const recentFailures = await countRecentSecurityEvents(db, {
        action: 'identity.login',
        outcome: 'failure',
        subjectId: user.id,
        windowSeconds: failedLoginWindowSeconds,
      });
      if (recentFailures >= maxFailedLogins) {
        await recordSecurityEvent(
          db,
          audit(
            {
              action: 'identity.login',
              outcome: 'denied',
              subjectId: user.id,
              details: { reason: 'throttled' },
            },
            ctx,
          ),
        );
        throw new AppError(
          429,
          'too_many_attempts',
          'Too many failed sign-in attempts. Try again later.',
        );
      }

      if (!(await verifyPassword(input.password, passwordHash))) {
        await recordSecurityEvent(
          db,
          audit(
            {
              action: 'identity.login',
              outcome: 'failure',
              subjectId: user.id,
              details: { reason: 'bad_password' },
            },
            ctx,
          ),
        );
        throw Errors.invalidCredentials();
      }

      if (user.status !== 'active') {
        await recordSecurityEvent(
          db,
          audit(
            {
              action: 'identity.login',
              outcome: 'denied',
              actorUserId: user.id,
              subjectId: user.id,
              details: { reason: `account_${user.status}` },
            },
            ctx,
          ),
        );
        throw new AppError(403, 'account_inactive', 'This account is not active.');
      }

      if (needsRehash(passwordHash, config.passwordHashLog2Cost)) {
        const upgraded = await hashPassword(input.password, config.passwordHashLog2Cost);
        await repo.updatePasswordHash(db, user.id, upgraded);
      }

      const session = await db.transaction(async (tx) => {
        const issued = await issueSession(tx, user.id, ctx);
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.login',
              outcome: 'success',
              actorUserId: user.id,
              subjectId: user.id,
              details: { sessionId: issued.id },
            },
            ctx,
          ),
        );
        return issued;
      });
      return { user, session };
    },

    /** Resolves a bearer token to a principal, or null if invalid/expired/revoked. */
    async authenticate(token: string): Promise<Principal | null> {
      if (!isWellFormedSessionToken(token)) return null;
      const session = await repo.findActiveSessionByTokenHash(db, hashSessionToken(token));
      if (!session) return null;
      if (Date.now() - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
        // Best effort: activity tracking must never fail the request.
        repo.touchSession(db, session.sessionId).catch((error: unknown) => {
          logger.warn({ err: error }, 'failed to update session last_seen_at');
        });
      }
      return { userId: session.userId, sessionId: session.sessionId, roles: session.roles };
    },

    async logout(principal: Principal, ctx: RequestContext): Promise<void> {
      await db.transaction(async (tx) => {
        await repo.revokeSession(tx, principal.sessionId, principal.userId, 'logout');
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.logout',
              outcome: 'success',
              actorUserId: principal.userId,
              subjectId: principal.sessionId,
            },
            ctx,
          ),
        );
      });
    },

    async listSessions(principal: Principal) {
      const sessions = await repo.listActiveSessions(db, principal.userId);
      return sessions.map((session) => ({
        ...session,
        current: session.id === principal.sessionId,
      }));
    },

    async revokeSession(
      principal: Principal,
      sessionId: string,
      ctx: RequestContext,
    ): Promise<void> {
      await db.transaction(async (tx) => {
        // Ownership is enforced in the query; another user's session reads as not found.
        const revoked = await repo.revokeSession(
          tx,
          sessionId,
          principal.userId,
          'revoked_by_user',
        );
        if (!revoked) throw Errors.notFound('Session');
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.session.revoke',
              outcome: 'success',
              actorUserId: principal.userId,
              subjectId: sessionId,
            },
            ctx,
          ),
        );
      });
    },

    async getCurrentUser(principal: Principal) {
      const user = await repo.findUserById(db, principal.userId);
      if (!user) throw Errors.notFound('User');
      return user;
    },

    async updateProfile(principal: Principal, patch: UpdateProfileInput, ctx: RequestContext) {
      return db.transaction(async (tx) => {
        const user = await repo.updateUserProfile(tx, principal.userId, patch);
        if (!user) throw Errors.notFound('User');
        await appendEvent<UserProfileUpdatedV1>(tx, {
          ...IdentityEvents.UserProfileUpdated,
          aggregateType: 'user',
          aggregateId: user.id,
          payload: {
            userId: user.id,
            changedFields: Object.keys(patch).sort(),
            displayName: user.displayName,
            locale: user.locale,
            timezone: user.timezone,
            countryCode: user.countryCode,
          },
          metadata: { requestId: ctx.requestId, actorUserId: principal.userId },
        });
        return user;
      });
    },
  };
}

export type IdentityService = ReturnType<typeof createIdentityService>;
