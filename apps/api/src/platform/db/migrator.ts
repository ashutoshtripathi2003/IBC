import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type pg from 'pg';

/**
 * Forward-only SQL migrations.
 *
 * - Files are named `NNNN_description.sql` and applied in order, each in its own transaction.
 * - A checksum of every applied file is recorded; editing an applied migration is an error.
 * - A PostgreSQL advisory lock serialises concurrent runners (e.g. several pods starting).
 */
export interface MigrationResult {
  applied: string[];
  alreadyApplied: number;
}

interface MigrationFile {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

const FILE_PATTERN = /^(\d{4})_([a-z0-9_]+)\.sql$/;
// Arbitrary constant identifying the IBC migration lock.
const ADVISORY_LOCK_KEY = 4_242_001;

export async function loadMigrations(directory: string): Promise<MigrationFile[]> {
  const entries = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  const migrations: MigrationFile[] = [];
  for (const file of entries) {
    const match = FILE_PATTERN.exec(file);
    if (!match) throw new Error(`Invalid migration file name: ${file}`);
    const sql = await readFile(path.join(directory, file), 'utf8');
    migrations.push({
      version: match[1]!,
      name: match[2]!,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    });
  }
  const versions = new Set(migrations.map((m) => m.version));
  if (versions.size !== migrations.length) throw new Error('Duplicate migration version');
  return migrations;
}

export async function migrate(pool: pg.Pool, directory: string): Promise<MigrationResult> {
  const migrations = await loadMigrations(directory);
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    await client.query('CREATE SCHEMA IF NOT EXISTS platform');
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform.schema_migrations (
        version    text        PRIMARY KEY,
        name       text        NOT NULL,
        checksum   text        NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);

    const { rows } = await client.query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM platform.schema_migrations',
    );
    const applied = new Map(rows.map((row) => [row.version, row.checksum]));
    const known = new Set(migrations.map((m) => m.version));
    for (const version of applied.keys()) {
      if (!known.has(version)) {
        throw new Error(`Database has migration ${version} that is missing from ${directory}`);
      }
    }

    const result: MigrationResult = { applied: [], alreadyApplied: 0 };
    for (const migration of migrations) {
      const existing = applied.get(migration.version);
      if (existing !== undefined) {
        if (existing !== migration.checksum) {
          throw new Error(
            `Migration ${migration.version}_${migration.name} was modified after being applied`,
          );
        }
        result.alreadyApplied += 1;
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO platform.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [migration.version, migration.name, migration.checksum],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${migration.version}_${migration.name} failed`, {
          cause: error,
        });
      }
      result.applied.push(`${migration.version}_${migration.name}`);
    }
    return result;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => undefined);
    client.release();
  }
}
