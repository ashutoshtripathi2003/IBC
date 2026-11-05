import { describe, expect, it, vi } from 'vitest';
import type { BffConfig } from './config';
import { bffConfig } from './config';
import { clientIp, MAX_BODY_BYTES } from './http';
import { currentSession, isUuid, proxy, type ProxyOptions } from './proxy';
import { readSessionToken, setSessionCookie } from './session-cookie';

const SITE = 'https://ibc.example';
const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const TOKEN = `ibc_st_${'a'.repeat(43)}`;
const config: BffConfig = {
  apiUrl: 'http://api.internal:3000',
  siteOrigin: SITE,
  trustedProxyHops: 0,
  secureCookies: true,
};

function req(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  return new Request(SITE + path, {
    method: init.method ?? 'GET',
    headers: init.headers ?? {},
    ...(init.body === undefined ? {} : { body: init.body }),
  });
}

const sameSite = { origin: SITE, 'sec-fetch-site': 'same-origin' };
const jsonHeaders = { ...sameSite, 'content-type': 'application/json' };
const login: ProxyOptions = {
  method: 'POST',
  path: '/auth/login',
  auth: false,
  body: true,
  session: 'issue',
};

function api(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', ...headers },
      }),
    ),
  );
}

describe('BFF proxy security', () => {
  it('rejects state-changing requests from other sites before calling the API', async () => {
    const fetchImpl = api(200, {});
    for (const headers of [
      { 'content-type': 'application/json' },
      { 'content-type': 'application/json', origin: 'https://evil.example' },
      { 'content-type': 'application/json', origin: SITE, 'sec-fetch-site': 'cross-site' },
      { 'content-type': 'application/json', origin: SITE, 'sec-fetch-site': 'same-site' },
    ]) {
      const response = await proxy(
        req('/api/auth/login', { method: 'POST', headers, body: '{}' }),
        login,
        config,
        fetchImpl,
      );
      expect(response.status).toBe(403);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts JSON objects only, within the size limit', async () => {
    const fetchImpl = api(200, {});
    const send = (body: string, type = 'application/json') =>
      proxy(
        req('/api/auth/login', {
          method: 'POST',
          headers: { ...sameSite, 'content-type': type },
          body,
        }),
        login,
        config,
        fetchImpl,
      );
    expect((await send('{}', 'text/plain')).status).toBe(415);
    expect((await send('email=a', 'application/x-www-form-urlencoded')).status).toBe(415);
    expect((await send('[1]')).status).toBe(400);
    expect((await send('not json')).status).toBe(400);
    expect((await send(JSON.stringify({ a: 'x'.repeat(MAX_BODY_BYTES) }))).status).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('stores the session token only in an httpOnly __Host- cookie', async () => {
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    const fetchImpl = api(200, {
      user: { id: 'u1' },
      session: { id: 's1', token: TOKEN, expiresAt },
    });
    const response = await proxy(
      req('/api/auth/login', {
        method: 'POST',
        headers: jsonHeaders,
        body: '{"email":"a@example.com","password":"x"}',
      }),
      login,
      config,
      fetchImpl,
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(TOKEN);
    expect(JSON.parse(text)).toEqual({ user: { id: 'u1' } });
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^__Host-ibc_session=ibc_st_/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toMatch(/Domain=/i);
    expect(response.headers.get('cache-control')).toBe('no-store');
    // The request went to the fixed API operation, without credentials of its own.
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('http://api.internal:3000/v1/auth/login');
    expect(new Headers(init?.headers).get('authorization')).toBeNull();
    expect(init?.redirect).toBe('error');
  });

  it('sends the cookie token as a bearer token and clears the cookie when the API rejects it', async () => {
    const fetchImpl = api(401, { code: 'unauthenticated' });
    const response = await proxy(
      req('/api/me', { headers: { cookie: `__Host-ibc_session=${TOKEN}` } }),
      { method: 'GET', path: '/me', auth: true, body: false },
      config,
      fetchImpl,
    );
    expect(new Headers(fetchImpl.mock.calls[0]![1]?.headers).get('authorization')).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('does not call the API for authenticated operations without a valid cookie', async () => {
    const fetchImpl = api(200, {});
    for (const cookie of [undefined, 'ibc_session=' + TOKEN, '__Host-ibc_session=forged']) {
      const response = await proxy(
        req('/api/me', cookie ? { headers: { cookie } } : {}),
        { method: 'GET', path: '/me', auth: true, body: false },
        config,
        fetchImpl,
      );
      expect(response.status).toBe(401);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('hides API failures and internal details', async () => {
    const failing = api(500, { detail: 'stack trace: secret' });
    const response = await proxy(
      req('/api/me', { headers: { cookie: `__Host-ibc_session=${TOKEN}` } }),
      { method: 'GET', path: '/me', auth: true, body: false },
      config,
      failing,
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('secret');
    const down = vi.fn<typeof fetch>(() => Promise.reject(new Error('ECONNREFUSED 10.0.0.1')));
    const r2 = await proxy(
      req('/api/me', { headers: { cookie: `__Host-ibc_session=${TOKEN}` } }),
      { method: 'GET', path: '/me', auth: true, body: false },
      config,
      down,
    );
    expect(r2.status).toBe(502);
    expect(await r2.text()).not.toContain('10.0.0.1');
  });

  it('passes API problems through and keeps a valid retry-after', async () => {
    const fetchImpl = api(429, { code: 'too_many_attempts' }, { 'retry-after': '60' });
    const response = await proxy(
      req('/api/auth/login', { method: 'POST', headers: jsonHeaders, body: '{}' }),
      login,
      config,
      fetchImpl,
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(((await response.json()) as { code: string }).code).toBe('too_many_attempts');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('reports accounts as unavailable when no API is configured', async () => {
    const off = { ...config, apiUrl: null };
    const response = await proxy(
      req('/api/auth/login', { method: 'POST', headers: jsonHeaders, body: '{}' }),
      login,
      off,
    );
    expect(response.status).toBe(503);
    expect(await (await currentSession(req('/api/auth/session'), off)).json()).toEqual({
      accounts: false,
      user: null,
    });
  });
});

describe('BFF session lifecycle', () => {
  it('never writes a malformed token into a cookie', async () => {
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    for (const token of ['ibc_st_abc; Domain=evil.example', 'other', 42]) {
      const fetchImpl = api(200, { user: {}, session: { token, expiresAt } });
      const response = await proxy(
        req('/api/auth/login', { method: 'POST', headers: jsonHeaders, body: '{}' }),
        login,
        config,
        fetchImpl,
      );
      expect(response.status).toBe(502);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('logout clears the cookie even when the API is unreachable', async () => {
    const down = vi.fn<typeof fetch>(() => Promise.reject(new Error('down')));
    const response = await proxy(
      req('/api/auth/logout', {
        method: 'POST',
        headers: { ...sameSite, cookie: `__Host-ibc_session=${TOKEN}` },
      }),
      { method: 'POST', path: '/auth/logout', auth: true, body: false, session: 'end' },
      config,
      down,
    );
    expect(response.status).toBe(502);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('a failed password reset keeps the current session', async () => {
    const fetchImpl = api(400, { code: 'invalid_token' });
    const response = await proxy(
      req('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { ...jsonHeaders, cookie: `__Host-ibc_session=${TOKEN}` },
        body: '{"token":"x","newPassword":"y"}',
      }),
      {
        method: 'POST',
        path: '/auth/password-reset/confirm',
        auth: false,
        body: true,
        session: 'ended-on-success',
      },
      config,
      fetchImpl,
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('BFF empty answers', () => {
  it('relays 202 and 204 without a body', async () => {
    for (const status of [202, 204]) {
      const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status })));
      const response = await proxy(
        req('/api/auth/password-reset', {
          method: 'POST',
          headers: jsonHeaders,
          body: '{"email":"a@b.co"}',
        }),
        { method: 'POST', path: '/auth/password-reset', auth: false, body: true },
        config,
        fetchImpl,
      );
      expect(response.status).toBe(status);
      expect(await response.text()).toBe('');
    }
  });
});

describe('BFF helpers', () => {
  it('forwards a client IP only through trusted proxies', () => {
    const r = req('/', { headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.0.0.2' } });
    expect(clientIp(r, 0)).toBeNull();
    expect(clientIp(r, 1)).toBe('10.0.0.2');
    expect(clientIp(r, 2)).toBe('203.0.113.9');
    expect(clientIp(req('/', { headers: { 'x-forwarded-for': '<script>' } }), 1)).toBeNull();
  });

  it('validates path parameters', () => {
    expect(isUuid('0193a1b2-0000-7000-8000-000000000000')).toBe(true);
    expect(isUuid('../me')).toBe(false);
    expect(isUuid('0193a1b2-0000-7000-8000-000000000000/..')).toBe(false);
  });

  it('only reads well-formed session tokens and sets an expiring cookie', () => {
    expect(
      readSessionToken(req('/', { headers: { cookie: `a=1; __Host-ibc_session=${TOKEN}` } }), true),
    ).toBe(TOKEN);
    expect(
      readSessionToken(req('/', { headers: { cookie: '__Host-ibc_session=ibc_st_x;y' } }), true),
    ).toBeNull();
    const cookie = setSessionCookie(TOKEN, new Date(Date.now() + 60_000).toISOString(), false);
    expect(cookie).toMatch(/^ibc_session=/);
    expect(cookie).not.toContain('Secure');
    expect(Number(/Max-Age=(\d+)/.exec(cookie)?.[1])).toBeGreaterThan(50);
  });

  it('rejects malformed configuration', () => {
    expect(() => bffConfig(env({ IBC_API_URL: 'not a url' }))).toThrow();
    expect(() => bffConfig(env({ IBC_API_URL: 'file:///etc' }))).toThrow();
    expect(() => bffConfig(env({ IBC_TRUSTED_PROXY_HOPS: '-1' }))).toThrow();
    expect(() =>
      bffConfig(env({ NODE_ENV: 'production', IBC_API_URL: 'http://api.internal' })),
    ).toThrow(/IBC_SITE_ORIGIN/);
    expect(bffConfig(env({ IBC_API_URL: 'http://localhost:3000/x' })).apiUrl).toBe(
      'http://localhost:3000',
    );
  });
});
