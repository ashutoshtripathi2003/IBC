import { setTimeout as sleep } from 'node:timers/promises';
import { pino } from 'pino';
import { loadConfig } from './platform/config.js';
import { createDatabase } from './platform/db/database.js';
import { relayEmailBatch, type EmailTransport } from './platform/email/email.js';
import { createLogEmailTransport, createSesEmailTransport } from './platform/email/transports.js';
import { createLogPublisher, relayOutboxBatch } from './platform/events/relay.js';
import { loggerOptions } from './platform/logger.js';
import { shutdownTelemetry, withSpan } from './platform/observability/trace-context.js';

/**
 * Background worker: relays domain events from the outbox and delivers queued
 * emails. Runs separately from the API so delivery can scale and fail independently.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const logger = pino({ ...loggerOptions(config), name: 'worker' });
  const db = createDatabase(config);
  // TODO(events): replace with the Kafka publisher once the event bus is provisioned.
  const publisher = createLogPublisher(logger);
  const emailTransport: EmailTransport =
    config.EMAIL_TRANSPORT === 'ses'
      ? createSesEmailTransport({
          region: config.AWS_REGION,
          from: config.EMAIL_FROM,
          configurationSet: config.SES_CONFIGURATION_SET,
        })
      : createLogEmailTransport(logger);
  const controller = new AbortController();

  const stop = (signal: string) => {
    logger.info({ signal }, 'stopping worker');
    controller.abort();
  };
  process.on('SIGTERM', () => {
    stop('SIGTERM');
  });
  process.on('SIGINT', () => {
    stop('SIGINT');
  });

  logger.info({ emailTransport: config.EMAIL_TRANSPORT }, 'worker started');
  while (!controller.signal.aborted) {
    let backlog = false;
    try {
      const events = await withSpan('outbox.relay_batch', {}, () =>
        relayOutboxBatch(
          db,
          publisher,
          { batchSize: config.OUTBOX_BATCH_SIZE, maxAttempts: config.OUTBOX_MAX_ATTEMPTS },
          logger,
        ),
      );
      backlog ||=
        events.published + events.failed + events.deadLettered >= config.OUTBOX_BATCH_SIZE;
    } catch (error) {
      logger.error({ err: error }, 'event relay iteration failed');
    }
    try {
      const emails = await withSpan('email.relay_batch', {}, () =>
        relayEmailBatch(
          db,
          emailTransport,
          { batchSize: config.OUTBOX_BATCH_SIZE, maxAttempts: config.EMAIL_MAX_ATTEMPTS },
          logger,
        ),
      );
      backlog ||= emails.sent + emails.failed + emails.deadLettered >= config.OUTBOX_BATCH_SIZE;
    } catch (error) {
      logger.error({ err: error }, 'email relay iteration failed');
    }
    // A full batch means there is a backlog: continue immediately.
    if (backlog) continue;
    await sleep(config.OUTBOX_POLL_INTERVAL_MS, undefined, { signal: controller.signal }).catch(
      () => undefined,
    );
  }
  await db.close();
  await shutdownTelemetry();
  logger.info('worker stopped');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
