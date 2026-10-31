import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig, type Config } from '../src/platform/config.js';
import { createDatabase, type Database } from '../src/platform/db/database.js';
import { migrate } from '../src/platform/db/migrator.js';

export const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://ibc:ibc_dev_password@localhost:5432/ibc_test';

export function testConfig(overrides: Record<string, string> = {}): Config {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    LOG_LEVEL: 'silent',
    // Lower cost keeps the suite fast; production enforces >= 17 in config validation.
    PASSWORD_HASH_LOG2_COST: '10',
    RATE_LIMIT_AUTH_PER_MINUTE: '1000',
    RATE_LIMIT_GLOBAL_PER_MINUTE: '10000',
    ...overrides,
  });
  // Safety: the suite drops schemas, so refuse anything that is not a test database.
  const name = new URL(config.DATABASE_URL).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to run tests against non-test database "${name}"`);
  }
  return config;
}

export async function resetDatabase(db: Database): Promise<void> {
  await db.query('DROP SCHEMA IF EXISTS identity, audit, platform CASCADE');
  await migrate(db.pool, MIGRATIONS_DIR);
}

export interface TestContext {
  app: FastifyInstance;
  db: Database;
  config: Config;
  healthState: { draining: boolean };
  close(): Promise<void>;
}

export async function createTestContext(
  overrides: Record<string, string> = {},
  options: { reset?: boolean } = {},
): Promise<TestContext> {
  const config = testConfig(overrides);
  const db = createDatabase(config);
  if (options.reset !== false) await resetDatabase(db);
  const healthState = { draining: false };
  const app = await buildApp({ config, db, healthState });
  await app.ready();
  return {
    app,
    db,
    config,
    healthState,
    async close() {
      await app.close();
      await db.close();
    },
  };
}

let counter = 0;
export function uniqueEmail(): string {
  counter += 1;
  return `user${Date.now()}${counter}@example.com`;
}

export async function registerUser(
  app: FastifyInstance,
  overrides: Record<string, unknown> = {},
): Promise<{ token: string; userId: string; sessionId: string; email: string; password: string }> {
  const email = (overrides.email as string | undefined) ?? uniqueEmail();
  const password = (overrides.password as string | undefined) ?? 'a sufficiently long passphrase';
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/register',
    payload: { displayName: 'Test User', ...overrides, email, password },
  });
  if (response.statusCode !== 201) {
    throw new Error(`register failed: ${response.statusCode} ${response.body}`);
  }
  const body = response.json();
  return {
    token: body.session.token,
    userId: body.user.id,
    sessionId: body.session.id,
    email,
    password,
  };
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
