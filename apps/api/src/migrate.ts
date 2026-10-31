import { fileURLToPath } from 'node:url';
import { loadConfig } from './platform/config.js';
import { createDatabase } from './platform/db/database.js';
import { migrate } from './platform/db/migrator.js';

/** Applies pending migrations. Run as a deploy step before rolling out new API pods. */
async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config);
  try {
    // Both src/ (dev) and dist/ (prod) sit one level below the migrations directory.
    const directory = fileURLToPath(new URL('../migrations', import.meta.url));
    const result = await migrate(db.pool, directory);
    console.log(
      JSON.stringify({
        msg: 'migrations complete',
        applied: result.applied,
        alreadyApplied: result.alreadyApplied,
      }),
    );
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
