import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestContext,
  registerUser,
  uniqueEmail,
  type TestContext,
} from './helpers.js';

describe('email verification and password reset', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestContext({ APP_BASE_URL: 'https://app.ibc.test' });
  });
  afterAll(() => ctx.close());

  async function latestEmail(to: string, template: string) {
    const { rows } = await ctx.db.query<{ subject: string; text_body: string }>(
      `SELECT subject, text_body FROM platform.email_outbox
        WHERE to_address = $1 AND template = $2 ORDER BY created_at DESC, id DESC LIMIT 1`,
      [to, template],
    );
    return rows[0];
  }

  async function latestToken(to: string, template: string): Promise<string> {
    const email = await latestEmail(to, template);
    const match = /#token=(\S+)/.exec(email?.text_body ?? '');
    if (!match) throw new Error(`no ${template} email for ${to}`);
    return match[1]!;
  }

  const post = (url: string, payload: object, headers: Record<string, string> = {}) =>
    ctx.app.inject({ method: 'POST', url, payload, headers });

  describe('email verification', () => {
    it('sends a verification link on registration and verifies the email', async () => {
      const user = await registerUser(ctx.app);
      const email = await latestEmail(user.email, 'identity.verify_email');
      expect(email?.subject).toBe('Verify your email for IBC');
      expect(email?.text_body).toContain('https://app.ibc.test/verify-email#token=ibc_ev_');

      const token = await latestToken(user.email, 'identity.verify_email');
      const confirm = await post('/v1/auth/email-verification/confirm', { token });
      expect(confirm.statusCode).toBe(200);
      expect(confirm.json().user.emailVerified).toBe(true);

      const events = await ctx.db.query(
        `SELECT 1 FROM platform.outbox_events
          WHERE aggregate_id = $1 AND event_type = 'identity.user.email_verified'`,
        [user.userId],
      );
      expect(events.rowCount).toBe(1);
    });

    it('stores only token hashes', async () => {
      const user = await registerUser(ctx.app);
      const token = await latestToken(user.email, 'identity.verify_email');
      const { rows } = await ctx.db.query(
        'SELECT token_hash FROM identity.one_time_tokens WHERE user_id = $1',
        [user.userId],
      );
      expect(rows[0]!.token_hash.toString('utf8')).not.toContain(token);
    });

    it('rejects reused, unknown and malformed tokens', async () => {
      const user = await registerUser(ctx.app);
      const token = await latestToken(user.email, 'identity.verify_email');
      expect((await post('/v1/auth/email-verification/confirm', { token })).statusCode).toBe(200);
      for (const bad of [token, `ibc_ev_${'A'.repeat(43)}`, 'ibc_pr_not-the-right-kind-1']) {
        const response = await post('/v1/auth/email-verification/confirm', { token: bad });
        expect(response.statusCode).toBe(400);
        expect(response.json().code).toBe('invalid_token');
      }
    });

    it('rejects expired tokens', async () => {
      const user = await registerUser(ctx.app);
      const token = await latestToken(user.email, 'identity.verify_email');
      await ctx.db.query(
        `UPDATE identity.one_time_tokens SET expires_at = now() - interval '1 second' WHERE user_id = $1`,
        [user.userId],
      );
      const response = await post('/v1/auth/email-verification/confirm', { token });
      expect(response.statusCode).toBe(400);
    });

    it('resends a link, invalidating the previous one', async () => {
      const user = await registerUser(ctx.app);
      const first = await latestToken(user.email, 'identity.verify_email');
      const resend = await post('/v1/auth/email-verification', {}, bearer(user.token));
      expect(resend.statusCode).toBe(202);
      const second = await latestToken(user.email, 'identity.verify_email');
      expect(second).not.toBe(first);
      expect((await post('/v1/auth/email-verification/confirm', { token: first })).statusCode).toBe(
        400,
      );
      expect(
        (await post('/v1/auth/email-verification/confirm', { token: second })).statusCode,
      ).toBe(200);
    });

    it('limits verification emails per account', async () => {
      const user = await registerUser(ctx.app); // registration sent 1
      for (let i = 0; i < 4; i += 1) {
        expect((await post('/v1/auth/email-verification', {}, bearer(user.token))).statusCode).toBe(
          202,
        );
      }
      const limited = await post('/v1/auth/email-verification', {}, bearer(user.token));
      expect(limited.statusCode).toBe(429);
    });

    it('requires authentication to request a link', async () => {
      expect((await post('/v1/auth/email-verification', {})).statusCode).toBe(401);
    });
  });

  describe('password reset', () => {
    it('resets the password, signs out all sessions and notifies the owner', async () => {
      const user = await registerUser(ctx.app);
      const request = await post('/v1/auth/password-reset', { email: user.email.toUpperCase() });
      expect(request.statusCode).toBe(202);

      const token = await latestToken(user.email, 'identity.password_reset');
      expect(token).toMatch(/^ibc_pr_/);
      const newPassword = 'a completely new passphrase';
      const confirm = await post('/v1/auth/password-reset/confirm', { token, newPassword });
      expect(confirm.statusCode).toBe(204);

      const oldSession = await ctx.app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: bearer(user.token),
      });
      expect(oldSession.statusCode).toBe(401);

      const oldLogin = await post('/v1/auth/login', { email: user.email, password: user.password });
      expect(oldLogin.statusCode).toBe(401);
      const newLogin = await post('/v1/auth/login', { email: user.email, password: newPassword });
      expect(newLogin.statusCode).toBe(200);
      // Completing a reset proves mailbox control.
      expect(newLogin.json().user.emailVerified).toBe(true);

      const notice = await latestEmail(user.email, 'identity.password_changed');
      expect(notice?.subject).toBe('Your IBC password was changed');

      expect(
        (await post('/v1/auth/password-reset/confirm', { token, newPassword })).statusCode,
      ).toBe(400);
    });

    it('answers identically for unknown accounts and sends nothing', async () => {
      const email = uniqueEmail();
      const response = await post('/v1/auth/password-reset', { email });
      expect(response.statusCode).toBe(202);
      expect(response.body).toBe('');
      const { rowCount } = await ctx.db.query(
        'SELECT 1 FROM platform.email_outbox WHERE to_address = $1',
        [email],
      );
      expect(rowCount).toBe(0);
    });

    it('does not send reset links to suspended accounts', async () => {
      const user = await registerUser(ctx.app);
      await ctx.db.query(`UPDATE identity.users SET status = 'suspended' WHERE id = $1`, [
        user.userId,
      ]);
      expect((await post('/v1/auth/password-reset', { email: user.email })).statusCode).toBe(202);
      expect(await latestEmail(user.email, 'identity.password_reset')).toBeUndefined();
    });

    it('silently caps reset emails per account', async () => {
      const user = await registerUser(ctx.app);
      for (let i = 0; i < 7; i += 1) {
        expect((await post('/v1/auth/password-reset', { email: user.email })).statusCode).toBe(202);
      }
      const { rows } = await ctx.db.query(
        `SELECT count(*)::int AS n FROM platform.email_outbox
          WHERE to_address = $1 AND template = 'identity.password_reset'`,
        [user.email],
      );
      expect(rows[0]!.n).toBe(5);
    });

    it('enforces the password policy and rejects expired tokens', async () => {
      const user = await registerUser(ctx.app);
      await post('/v1/auth/password-reset', { email: user.email });
      const token = await latestToken(user.email, 'identity.password_reset');
      const weak = await post('/v1/auth/password-reset/confirm', { token, newPassword: 'short' });
      expect(weak.statusCode).toBe(400);
      await ctx.db.query(
        `UPDATE identity.one_time_tokens SET expires_at = now() - interval '1 second'
          WHERE user_id = $1 AND purpose = 'password_reset'`,
        [user.userId],
      );
      const expired = await post('/v1/auth/password-reset/confirm', {
        token,
        newPassword: 'a completely new passphrase',
      });
      expect(expired.statusCode).toBe(400);
    });

    it('clears the failed-login throttle after a successful reset', async () => {
      const user = await registerUser(ctx.app);
      for (let i = 0; i < 10; i += 1) {
        await post('/v1/auth/login', { email: user.email, password: 'wrong password attempt' });
      }
      expect(
        (await post('/v1/auth/login', { email: user.email, password: user.password })).statusCode,
      ).toBe(429);
      await post('/v1/auth/password-reset', { email: user.email });
      const token = await latestToken(user.email, 'identity.password_reset');
      const newPassword = 'recovered passphrase here';
      expect(
        (await post('/v1/auth/password-reset/confirm', { token, newPassword })).statusCode,
      ).toBe(204);
      expect(
        (await post('/v1/auth/login', { email: user.email, password: newPassword })).statusCode,
      ).toBe(200);
    });
  });
});
