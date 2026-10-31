import { uuidv7 } from '@ibc/kernel';
import type { FastifyBaseLogger } from 'fastify';
import {
  countRecentSecurityEvents,
  recordSecurityEvent,
} from '../../platform/audit/security-audit.js';
import { Roles, type Principal } from '../../platform/authz/authorization.js';
import { isUniqueViolation, type Database } from '../../platform/db/database.js';
import { enqueueEmail } from '../../platform/email/email.js';
import { appendEvent } from '../../platform/events/outbox.js';
import { AppError, Errors } from '../../platform/http/errors.js';
import { describeDuration, renderIdentityEmail, type IdentityEmailTemplate } from './emails.js';
import {
  IdentityEvents,
  type UserCreatedV1,
  type UserEmailVerifiedV1,
  type UserProfileUpdatedV1,
} from './events.js';
import { hashPassword, needsRehash, verifyPassword } from './password.js';
import * as repo from './repository.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './schemas.js';
import {
  generateSessionToken,
  generateToken,
  hashSessionToken,
  hashToken,
  isWellFormedSessionToken,
  isWellFormedToken,
  TokenPrefixes,
} from './tokens.js';

export interface IdentityConfig {
  sessionTtlHours: number;
  passwordHashLog2Cost: number;
  /** Failed logins per account within the window before further attempts are refused. */
  maxFailedLoginsPerAccount?: number;
  failedLoginWindowSeconds?: number;
  /** Public web app URL used to build links in emails. */
  appBaseUrl: string;
  emailVerificationTtlHours: number;
  passwordResetTtlMinutes: number;
  /** Maximum verification/reset emails per account per hour (anti email-bombing). */
  maxTokensPerHour?: number;
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

const invalidToken = () =>
  new AppError(400, 'invalid_token', 'This link is invalid or has expired. Request a new one.');

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
  const maxTokensPerHour = config.maxTokensPerHour ?? 5;
  type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

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

  /** Issues a fresh single-use token (invalidating older ones) and queues its email. */
  async function sendOneTimeLink(
    tx: Tx,
    user: repo.UserRecord,
    purpose: repo.OneTimeTokenPurpose,
  ): Promise<void> {
    const isReset = purpose === 'password_reset';
    const ttlMinutes = isReset
      ? config.passwordResetTtlMinutes
      : config.emailVerificationTtlHours * 60;
    const token = generateToken(
      isReset ? TokenPrefixes.passwordReset : TokenPrefixes.emailVerification,
    );
    await repo.invalidateOneTimeTokens(tx, user.id, purpose);
    await repo.insertOneTimeToken(tx, {
      id: uuidv7(),
      userId: user.id,
      purpose,
      tokenHash: hashToken(token),
      email: user.email,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    });
    const path = isReset ? 'reset-password' : 'verify-email';
    const link = `${config.appBaseUrl.replace(/\/$/, '')}/${path}#token=${token}`;
    await sendEmail(tx, user, isReset ? 'password_reset' : 'verify_email', {
      link,
      expiresIn: describeDuration(ttlMinutes),
    });
  }

  async function sendEmail(
    tx: Tx,
    user: repo.UserRecord,
    template: IdentityEmailTemplate,
    params: { link?: string; expiresIn?: string } = {},
  ): Promise<void> {
    const rendered = renderIdentityEmail(template, user.locale, {
      displayName: user.displayName,
      ...params,
    });
    await enqueueEmail(tx, { to: user.email, template: `identity.${template}`, ...rendered });
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
          await sendOneTimeLink(tx, user, 'email_verification');
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

      const { user, passwordHash, passwordUpdatedAt } = found;
      const recentFailures = await countRecentSecurityEvents(db, {
        action: 'identity.login',
        outcome: 'failure',
        subjectId: user.id,
        windowSeconds: failedLoginWindowSeconds,
        // Failures before the last password change (e.g. a reset) no longer count.
        since: passwordUpdatedAt,
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

    /** Sends a new verification link to the caller's current email. No-op if already verified. */
    async requestEmailVerification(principal: Principal, ctx: RequestContext): Promise<void> {
      const user = await repo.findUserById(db, principal.userId);
      if (!user) throw Errors.notFound('User');
      if (user.emailVerifiedAt) return;
      const recent = await repo.countRecentOneTimeTokens(db, user.id, 'email_verification', 3600);
      if (recent >= maxTokensPerHour) {
        throw new AppError(
          429,
          'too_many_requests',
          'Too many verification emails. Try again later.',
        );
      }
      await db.transaction(async (tx) => {
        await sendOneTimeLink(tx, user, 'email_verification');
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.email_verification.request',
              outcome: 'success',
              actorUserId: user.id,
              subjectId: user.id,
            },
            ctx,
          ),
        );
      });
    },

    /** Consumes a verification token. Does not require a session (the link may open elsewhere). */
    async confirmEmailVerification(token: string, ctx: RequestContext) {
      if (!isWellFormedToken(token, TokenPrefixes.emailVerification)) throw invalidToken();
      return db.transaction(async (tx) => {
        const consumed = await repo.consumeOneTimeToken(tx, hashToken(token), 'email_verification');
        // Fails if the user changed their email since the link was sent.
        const user = consumed
          ? await repo.markEmailVerified(tx, consumed.userId, consumed.email)
          : null;
        if (!user) throw invalidToken();
        await appendEvent<UserEmailVerifiedV1>(tx, {
          ...IdentityEvents.UserEmailVerified,
          aggregateType: 'user',
          aggregateId: user.id,
          payload: { userId: user.id },
          metadata: { requestId: ctx.requestId, actorUserId: user.id },
        });
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.email_verification.confirm',
              outcome: 'success',
              actorUserId: user.id,
              subjectId: user.id,
            },
            ctx,
          ),
        );
        return user;
      });
    },

    /**
     * Starts a password reset. Always completes silently so callers cannot learn
     * whether an email is registered; outcomes are recorded in the audit log.
     */
    async requestPasswordReset(email: string, ctx: RequestContext): Promise<void> {
      const found = await repo.findCredentialByEmail(db, normalizeEmail(email));
      const auditDenied = (reason: string, subjectId?: string) =>
        recordSecurityEvent(
          db,
          audit(
            {
              action: 'identity.password_reset.request',
              outcome: 'denied',
              subjectId: subjectId ?? null,
              details: { reason },
            },
            ctx,
          ),
        );
      if (!found) return auditDenied('unknown_account');
      const { user } = found;
      if (user.status !== 'active') return auditDenied(`account_${user.status}`, user.id);
      const recent = await repo.countRecentOneTimeTokens(db, user.id, 'password_reset', 3600);
      if (recent >= maxTokensPerHour) return auditDenied('throttled', user.id);
      await db.transaction(async (tx) => {
        await sendOneTimeLink(tx, user, 'password_reset');
        await recordSecurityEvent(
          tx,
          audit(
            { action: 'identity.password_reset.request', outcome: 'success', subjectId: user.id },
            ctx,
          ),
        );
      });
    },

    /** Sets a new password, signs out every session and notifies the account owner. */
    async confirmPasswordReset(token: string, newPassword: string, ctx: RequestContext) {
      if (!isWellFormedToken(token, TokenPrefixes.passwordReset)) throw invalidToken();
      const passwordHash = await hashPassword(newPassword, config.passwordHashLog2Cost);
      await db.transaction(async (tx) => {
        const consumed = await repo.consumeOneTimeToken(tx, hashToken(token), 'password_reset');
        const user = consumed ? await repo.findUserById(tx, consumed.userId) : null;
        if (!consumed || user?.status !== 'active') throw invalidToken();
        await repo.updatePasswordHash(tx, user.id, passwordHash);
        await repo.invalidateOneTimeTokens(tx, user.id, 'password_reset');
        // The reset proves control of the mailbox the link was sent to.
        await repo.markEmailVerified(tx, user.id, consumed.email);
        const revokedSessions = await repo.revokeAllSessions(tx, user.id, 'password_reset');
        await sendEmail(tx, user, 'password_changed');
        await recordSecurityEvent(
          tx,
          audit(
            {
              action: 'identity.password_reset.confirm',
              outcome: 'success',
              actorUserId: user.id,
              subjectId: user.id,
              details: { revokedSessions },
            },
            ctx,
          ),
        );
      });
    },
  };
}

export type IdentityService = ReturnType<typeof createIdentityService>;
