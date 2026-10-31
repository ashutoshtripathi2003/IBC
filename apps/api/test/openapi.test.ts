import { readFile } from 'node:fs/promises';
import { Validator } from '@seriousme/openapi-schema-validator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { apiDocument, apiOperations } from '../src/api-contract.js';
import {
  authResponseSchema,
  sessionListResponseSchema,
  userEnvelopeSchema,
} from '../src/modules/identity/schemas.js';
import { bearer, createTestContext, registerUser, type TestContext } from './helpers.js';

/** Routes that are intentionally not part of the published contract. */
const UNDOCUMENTED = new Set(['GET /openapi.json']);

const toFastifyPath = (path: string) => path.replace(/\{(\w+)\}/g, ':$1');

describe('OpenAPI contract', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('is a valid OpenAPI 3.1 document', async () => {
    const validator = new Validator();
    const result = await validator.validate(apiDocument());
    expect(result.errors ?? []).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('documents exactly the routes the server registers', () => {
    const registered = ctx.app.registeredRoutes
      .map((route) => `${route.method} ${route.url}`)
      .filter((route) => !UNDOCUMENTED.has(route))
      .sort();
    const documented = apiOperations
      .map((op) => `${op.method.toUpperCase()} ${toFastifyPath(op.path)}`)
      .sort();
    expect(registered).toEqual(documented);
  });

  it('has unique operation ids', () => {
    const ids = apiOperations.map((op) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('matches the committed docs/openapi.json (run `pnpm --filter @ibc/api openapi:export`)', async () => {
    const committed = JSON.parse(
      await readFile(new URL('../../../docs/openapi.json', import.meta.url), 'utf8'),
    );
    expect(committed).toEqual(apiDocument());
  });

  it('serves the document', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(apiDocument());
  });

  describe('real responses conform to the documented schemas', () => {
    const conforms = (schema: z.ZodType, body: unknown) => {
      const result = schema.safeParse(body);
      expect(result.success ? [] : result.error.issues).toEqual([]);
    };

    it('auth, account and session responses', async () => {
      const register = await ctx.app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: `contract${Date.now()}@example.com`,
          password: 'contract test passphrase',
          displayName: 'Contract',
          countryCode: 'IN',
        },
      });
      expect(register.statusCode).toBe(201);
      conforms(authResponseSchema, register.json());

      const token = register.json().session.token as string;
      const me = await ctx.app.inject({ method: 'GET', url: '/v1/me', headers: bearer(token) });
      conforms(userEnvelopeSchema, me.json());

      const patched = await ctx.app.inject({
        method: 'PATCH',
        url: '/v1/me',
        headers: bearer(token),
        payload: { countryCode: null },
      });
      conforms(userEnvelopeSchema, patched.json());

      const sessions = await ctx.app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: bearer(token),
      });
      conforms(sessionListResponseSchema, sessions.json());
    });

    it('error responses carry the documented problem fields', async () => {
      const user = await registerUser(ctx.app);
      const problems = [
        await ctx.app.inject({ method: 'GET', url: '/v1/me' }),
        await ctx.app.inject({ method: 'POST', url: '/v1/auth/register', payload: {} }),
        await ctx.app.inject({
          method: 'DELETE',
          url: '/v1/auth/sessions/01a18ffe-bfe1-74cf-ab00-7f3dfb33bdea',
          headers: bearer(user.token),
        }),
      ];
      const required = (
        apiDocument() as { components: { schemas: { Problem: { required: string[] } } } }
      ).components.schemas.Problem.required;
      for (const response of problems) {
        expect(response.headers['content-type']).toContain('application/problem+json');
        expect(Object.keys(response.json())).toEqual(expect.arrayContaining(required));
      }
    });

    it('every documented error status is one the operation can plausibly return', () => {
      for (const op of apiOperations) {
        if (op.authenticated) expect(op.errors, op.operationId).toContain(401);
        if (op.body)
          expect(op.errors, op.operationId).toEqual(expect.arrayContaining([400, 413, 415]));
      }
    });
  });
});
