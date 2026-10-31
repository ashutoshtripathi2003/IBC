import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from './helpers.js';

describe('platform HTTP behaviour', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('reports liveness and readiness', async () => {
    const live = await ctx.app.inject({ method: 'GET', url: '/health/live' });
    expect(live.statusCode).toBe(200);
    const ready = await ctx.app.inject({ method: 'GET', url: '/health/ready' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toMatchObject({ status: 'ready', checks: { database: 'ok' } });
  });

  it('fails readiness while draining', async () => {
    ctx.healthState.draining = true;
    try {
      const ready = await ctx.app.inject({ method: 'GET', url: '/health/ready' });
      expect(ready.statusCode).toBe(503);
    } finally {
      ctx.healthState.draining = false;
    }
  });

  it('sets security headers', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/health/live' });
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('propagates a valid upstream request id and generates one otherwise', async () => {
    const propagated = await ctx.app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { 'x-request-id': 'edge-abc-12345' },
    });
    expect(propagated.headers['x-request-id']).toBe('edge-abc-12345');
    const generated = await ctx.app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { 'x-request-id': 'bad id with spaces' },
    });
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns problem+json for unknown routes', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 404, code: 'route_not_found' });
  });

  it('accepts JSON only', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'text/plain' },
      payload: 'hello',
    });
    expect(response.statusCode).toBe(415);
  });

  it('rejects malformed JSON with a problem document', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":',
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
  });

  it('rejects oversized bodies', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'a@b.co', password: 'x'.repeat(70_000) },
    });
    expect(response.statusCode).toBe(413);
  });

  it('does not answer CORS preflight for unlisted origins', async () => {
    const response = await ctx.app.inject({
      method: 'OPTIONS',
      url: '/v1/me',
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('rate limiting', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestContext({ RATE_LIMIT_AUTH_PER_MINUTE: '3' }, { reset: false });
  });
  afterAll(() => ctx.close());

  it('limits authentication endpoints per client', async () => {
    const attempt = () =>
      ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'nobody@example.com', password: 'wrong password' },
      });
    for (let i = 0; i < 3; i += 1) expect((await attempt()).statusCode).toBe(401);
    const limited = await attempt();
    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toMatchObject({ code: 'rate_limited' });
    expect(limited.headers['retry-after']).toBeDefined();
  });
});
