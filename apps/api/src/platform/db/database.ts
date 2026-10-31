import pg from 'pg';
import type { Config } from '../config.js';

/** Anything that can run a query: the pool or a client inside a transaction. */
export interface Queryable {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}

export interface Database extends Queryable {
  /** Runs `work` in a transaction; commits on success, rolls back on any error. */
  transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>;
  ping(timeoutMs: number): Promise<void>;
  close(): Promise<void>;
  readonly pool: pg.Pool;
}

export function createDatabase(
  config: Pick<
    Config,
    | 'DATABASE_URL'
    | 'DATABASE_POOL_MAX'
    | 'DATABASE_STATEMENT_TIMEOUT_MS'
    | 'DATABASE_SSL'
    | 'SERVICE_NAME'
  >,
): Database {
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: config.DATABASE_POOL_MAX,
    statement_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000,
    application_name: config.SERVICE_NAME,
    ...(config.DATABASE_SSL ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  return {
    pool,
    query: (text, values) => pool.query(text, values),
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    async ping(timeoutMs) {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('database ping timed out'));
        }, timeoutMs);
      });
      try {
        await Promise.race([pool.query('SELECT 1'), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
    close: () => pool.end(),
  };
}

/** PostgreSQL SQLSTATE for unique_violation. */
export const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (!(error instanceof Error) || (error as { code?: string }).code !== UNIQUE_VIOLATION) {
    return false;
  }
  return constraint === undefined || (error as { constraint?: string }).constraint === constraint;
}
