import { cp, mkdtemp, readdir, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '../src/platform/db/database.js';
import { migrate } from '../src/platform/db/migrator.js';
import { MIGRATIONS_DIR, resetDatabase, testConfig } from './helpers.js';

describe('migrations', () => {
  let db: Database;
  beforeAll(async () => {
    db = createDatabase(testConfig());
    await resetDatabase(db);
  });
  afterAll(() => db.close());

  it('records every migration and is idempotent', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql'));
    const { rows } = await db.query('SELECT version FROM platform.schema_migrations');
    expect(rows).toHaveLength(files.length);
    const again = await migrate(db.pool, MIGRATIONS_DIR);
    expect(again.applied).toEqual([]);
    expect(again.alreadyApplied).toBe(files.length);
  });

  it('refuses to run when an applied migration was modified', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ibc-migrations-'));
    try {
      await cp(MIGRATIONS_DIR, dir, { recursive: true });
      await appendFile(path.join(dir, '0001_platform_foundation.sql'), '\n-- edited\n');
      await expect(migrate(db.pool, dir)).rejects.toThrow(/modified after being applied/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('keeps the security audit log append-only', async () => {
    await db.query(
      `INSERT INTO audit.security_events (id, action, outcome) VALUES (gen_random_uuid(), 't', 'success')`,
    );
    await expect(db.query('UPDATE audit.security_events SET action = $1', ['x'])).rejects.toThrow(
      /append-only/,
    );
    await expect(db.query('DELETE FROM audit.security_events')).rejects.toThrow(/append-only/);
  });
});
