import { setTimeout as sleep } from 'node:timers/promises';
import { pino } from 'pino';
import { loadConfig } from './platform/config.js';
import { createDatabase } from './platform/db/database.js';
import { createLogPublisher, relayOutboxBatch } from './platform/events/relay.js';
import { loggerOptions } from './platform/logger.js';

/**
 * Outbox relay worker. Runs as a separate process from the API so event
 * publishing can be scaled and fail independently of request serving.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const logger = pino({ ...loggerOptions(config), name: 'outbox-relay' });
  const db = createDatabase(config);
  // TODO(events): replace with the Kafka publisher once the event bus is provisioned.
  const publisher = createLogPublisher(logger);
  const controller = new AbortController();

  const stop = (signal: string) => {
    logger.info({ signal }, 'stopping outbox relay');
    controller.abort();
  };
  process.on('SIGTERM', () => {
    stop('SIGTERM');
  });
  process.on('SIGINT', () => {
    stop('SIGINT');
  });

  logger.info('outbox relay started');
  while (!controller.signal.aborted) {
    try {
      const result = await relayOutboxBatch(
        db,
        publisher,
        { batchSize: config.OUTBOX_BATCH_SIZE, maxAttempts: config.OUTBOX_MAX_ATTEMPTS },
        logger,
      );
      // A full batch means there is a backlog: continue immediately.
      if (result.published + result.failed + result.deadLettered >= config.OUTBOX_BATCH_SIZE)
        continue;
    } catch (error) {
      logger.error({ err: error }, 'outbox relay iteration failed');
    }
    await sleep(config.OUTBOX_POLL_INTERVAL_MS, undefined, { signal: controller.signal }).catch(
      () => undefined,
    );
  }
  await db.close();
  logger.info('outbox relay stopped');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
