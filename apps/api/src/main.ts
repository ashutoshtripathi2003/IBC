import { buildApp } from './app.js';
import { loadConfig } from './platform/config.js';
import { createDatabase } from './platform/db/database.js';

const SHUTDOWN_DRAIN_MS = 5_000;

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config);
  const healthState = { draining: false };
  const app = await buildApp({ config, db, healthState });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'shutting down');
    // Fail readiness first so the load balancer stops sending new traffic.
    healthState.draining = true;
    if (config.NODE_ENV === 'production') {
      await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_DRAIN_MS));
    }
    try {
      await app.close();
      await db.close();
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ err: reason }, 'unhandled promise rejection');
    process.exit(1);
  });

  await app.listen({ host: config.HOST, port: config.PORT });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
