import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestContext,
  registerUser,
  uniqueEmail,
  type TestContext,
} from './helpers.js';

describe('identity', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  describe('registration', () => {
    it('creates an account, a session, an outbox event and an audit record', async () => {
      const email = uniqueEmail();
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email,
          password: 'a sufficiently long passphrase',
          displayName: '  Priya Sharma ',
          locale: 'en-in',
          timezone: 'Asia/Kolkata',
          countryCode: 'in',
        },
      });
      expect(response.statusCode).toBe(201);
      expect(response.headers['cache-control']).toBe('no-store');
      const body = response.json();
      expect(body.user).toMatchObject({
        email,
        emailVerified: false,
        displayName: 'Priya Sharma',
        status: 'active',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata',
        countryCode: 'IN',
      });
      expect(body.session.token).toMatch(/^ibc_st_/);
      expect(JSON.stringify(body)).not.toContain('password');

      const events = await ctx.db.query(
        'SELECT event_type, event_version, payload FROM platform.outbox_events WHERE aggregate_id = $1',
        [body.user.id],
      );
      expect(events.rows).toEqual([
        expect.objectContaining({ event_type: 'identity.user.created', event_version: 1 }),
      ]);
      expect(events.rows[0]!.payload).not.toHaveProperty('email');

      const audit = await ctx.db.query(
        `SELECT action, outcome FROM audit.security_events WHERE actor_user_id = $1`,
        [body.user.id],
      );
      expect(audit.rows).toContainEqual({ action: 'identity.register', outcome: 'success' });

      const roles = await ctx.db.query('SELECT role FROM identity.user_roles WHERE user_id = $1', [
        body.user.id,
      ]);
      expect(roles.rows).toEqual([{ role: 'member' }]);
    });

    it('stores only a hash of the session token and a salted password hash', async () => {
      const user = await registerUser(ctx.app);
      const session = await ctx.db.query('SELECT token_hash FROM identity.sessions WHERE id = $1', [
        user.sessionId,
      ]);
      expect(session.rows[0]!.token_hash.toString('utf8')).not.toContain(user.token);
      const credential = await ctx.db.query(
        'SELECT password_hash FROM identity.password_credentials WHERE user_id = $1',
        [user.userId],
      );
      expect(credential.rows[0]!.password_hash).toMatch(/^\$scrypt\$/);
      expect(credential.rows[0]!.password_hash).not.toContain(user.password);
    });

    it('defaults globalization preferences without assuming a country', async () => {
      const user = await registerUser(ctx.app);
      const me = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(user.token),
      });
      expect(me.json().user).toMatchObject({ locale: 'en', timezone: 'UTC', countryCode: null });
    });

    it('treats email addresses case-insensitively for uniqueness', async () => {
      const email = uniqueEmail();
      await registerUser(ctx.app, { email });
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: email.toUpperCase(),
          password: 'another long passphrase',
          displayName: 'X',
        },
      });
      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({ code: 'email_taken' });
    });

    it('validates input and reports every field error', async () => {
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: 'not-an-email',
          password: 'short',
          displayName: '',
          timezone: 'Mars/Base',
          countryCode: 'ZZ',
          locale: 'not a locale',
        },
      });
      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe('validation_failed');
      const paths = body.errors.map((e: { path: string }) => e.path).sort();
      expect(paths).toEqual([
        'countryCode',
        'displayName',
        'email',
        'locale',
        'password',
        'timezone',
      ]);
    });

    it('rejects unknown fields (no mass assignment)', async () => {
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: uniqueEmail(),
          password: 'a sufficiently long passphrase',
          displayName: 'X',
          status: 'active',
          roles: ['platform_admin'],
        },
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('login', () => {
    it('issues a new session for valid credentials', async () => {
      const user = await registerUser(ctx.app);
      const response = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: user.email.toUpperCase(), password: user.password },
        headers: { 'user-agent': 'vitest/1.0' },
      });
      expect(response.statusCode).toBe(200);
      const { session } = response.json();
      expect(session.token).not.toBe(user.token);
      const me = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(session.token),
      });
      expect(me.statusCode).toBe(200);
      expect(me.json().user.id).toBe(user.userId);
    });

    it('gives the same answer for a wrong password and an unknown account', async () => {
      const user = await registerUser(ctx.app);
      const wrongPassword = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: user.email, password: 'definitely the wrong password' },
      });
      const unknown = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: uniqueEmail(), password: 'definitely the wrong password' },
      });
      expect(wrongPassword.statusCode).toBe(401);
      expect(unknown.statusCode).toBe(401);
      const strip = (body: Record<string, unknown>) => ({ ...body, requestId: undefined });
      expect(strip(wrongPassword.json())).toEqual(strip(unknown.json()));
    });

    it('throttles an account after repeated failures, even with the right password', async () => {
      const user = await registerUser(ctx.app);
      for (let i = 0; i < 10; i += 1) {
        const failed = await ctx.app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { email: user.email, password: 'wrong password attempt' },
        });
        expect(failed.statusCode).toBe(401);
      }
      const blocked = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: user.email, password: user.password },
      });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.json().code).toBe('too_many_attempts');
    });

    it('refuses suspended accounts and their existing sessions', async () => {
      const user = await registerUser(ctx.app);
      await ctx.db.query(`UPDATE identity.users SET status = 'suspended' WHERE id = $1`, [
        user.userId,
      ]);
      const me = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(user.token),
      });
      expect(me.statusCode).toBe(401);
      const login = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: user.email, password: user.password },
      });
      expect(login.statusCode).toBe(403);
      expect(login.json().code).toBe('account_inactive');
    });

    it('upgrades weak password hashes on login', async () => {
      const user = await registerUser(ctx.app);
      const stronger = await createTestContext({ PASSWORD_HASH_LOG2_COST: '11' }, { reset: false });
      try {
        const login = await stronger.app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { email: user.email, password: user.password },
        });
        expect(login.statusCode).toBe(200);
        const { rows } = await ctx.db.query(
          'SELECT password_hash FROM identity.password_credentials WHERE user_id = $1',
          [user.userId],
        );
        expect(rows[0]!.password_hash).toMatch(/^\$scrypt\$ln=11,/);
      } finally {
        await stronger.close();
      }
    });
  });

  describe('sessions', () => {
    it('rejects missing, malformed, unknown and expired tokens', async () => {
      const user = await registerUser(ctx.app);
      const cases = [
        {},
        { authorization: 'Bearer' },
        { authorization: 'Basic abc' },
        bearer('ibc_st_' + 'A'.repeat(43)),
        bearer(user.token + 'x'),
      ];
      for (const headers of cases) {
        const response = await ctx.app.inject({ method: 'GET', url: '/v1/me', headers });
        expect(response.statusCode).toBe(401);
        expect(response.json().code).toBe('unauthenticated');
      }
      await ctx.db.query(
        `UPDATE identity.sessions SET expires_at = now() - interval '1 second' WHERE id = $1`,
        [user.sessionId],
      );
      const expired = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(user.token),
      });
      expect(expired.statusCode).toBe(401);
    });

    it('logs out by revoking the current session', async () => {
      const user = await registerUser(ctx.app);
      const logout = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/logout',
        headers: bearer(user.token),
      });
      expect(logout.statusCode).toBe(204);
      const me = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(user.token),
      });
      expect(me.statusCode).toBe(401);
    });

    it('lists and revokes the caller’s own sessions', async () => {
      const user = await registerUser(ctx.app);
      const second = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: user.email, password: user.password },
      });
      const secondSession = second.json().session;

      const list = await ctx.app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: bearer(user.token),
      });
      expect(list.statusCode).toBe(200);
      const sessions = list.json().sessions;
      expect(sessions).toHaveLength(2);
      expect(sessions.find((s: { current: boolean }) => s.current).id).toBe(user.sessionId);
      expect(JSON.stringify(sessions)).not.toContain('ibc_st_');

      const revoke = await ctx.app.inject({
        method: 'DELETE',
        url: `/v1/auth/sessions/${secondSession.id}`,
        headers: bearer(user.token),
      });
      expect(revoke.statusCode).toBe(204);
      const revoked = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(secondSession.token),
      });
      expect(revoked.statusCode).toBe(401);
    });

    it('does not let a user revoke, or detect, another user’s session', async () => {
      const alice = await registerUser(ctx.app);
      const mallory = await registerUser(ctx.app);
      const attempt = await ctx.app.inject({
        method: 'DELETE',
        url: `/v1/auth/sessions/${alice.sessionId}`,
        headers: bearer(mallory.token),
      });
      expect(attempt.statusCode).toBe(404);
      const stillValid = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(alice.token),
      });
      expect(stillValid.statusCode).toBe(200);
    });

    it('validates session id parameters', async () => {
      const user = await registerUser(ctx.app);
      const response = await ctx.app.inject({
        method: 'DELETE',
        url: '/v1/auth/sessions/not-a-uuid',
        headers: bearer(user.token),
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('profile', () => {
    it('updates globalization preferences and emits a profile event', async () => {
      const user = await registerUser(ctx.app, { countryCode: 'IN' });
      const response = await ctx.app.inject({
        method: 'PATCH',
        url: '/v1/me',
        headers: bearer(user.token),
        payload: {
          displayName: 'Rahul Mehta',
          timezone: 'Asia/Dubai',
          countryCode: 'AE',
          locale: 'ar-AE',
        },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().user).toMatchObject({
        displayName: 'Rahul Mehta',
        timezone: 'Asia/Dubai',
        countryCode: 'AE',
        locale: 'ar-AE',
      });
      const events = await ctx.db.query(
        `SELECT payload FROM platform.outbox_events
          WHERE aggregate_id = $1 AND event_type = 'identity.user.profile_updated'`,
        [user.userId],
      );
      expect(events.rows[0]!.payload.changedFields).toEqual([
        'countryCode',
        'displayName',
        'locale',
        'timezone',
      ]);
    });

    it('can clear the country without touching other fields', async () => {
      const user = await registerUser(ctx.app, { countryCode: 'IN', timezone: 'Asia/Kolkata' });
      const response = await ctx.app.inject({
        method: 'PATCH',
        url: '/v1/me',
        headers: bearer(user.token),
        payload: { countryCode: null },
      });
      expect(response.json().user).toMatchObject({ countryCode: null, timezone: 'Asia/Kolkata' });
    });

    it('rejects empty, invalid and privileged updates', async () => {
      const user = await registerUser(ctx.app);
      for (const payload of [
        {},
        { timezone: 'Nowhere/Land' },
        { status: 'active' },
        { email: 'x@y.z' },
      ]) {
        const response = await ctx.app.inject({
          method: 'PATCH',
          url: '/v1/me',
          headers: bearer(user.token),
          payload,
        });
        expect(response.statusCode).toBe(400);
      }
    });

    it('requires authentication', async () => {
      const response = await ctx.app.inject({
        method: 'PATCH',
        url: '/v1/me',
        payload: { displayName: 'X' },
      });
      expect(response.statusCode).toBe(401);
    });
  });
});
