import type { LoggerOptions } from 'pino';
import type { Config } from './config.js';

/**
 * Structured JSON logging (pino). Secrets are redacted defensively even though
 * request bodies and headers are not logged by default.
 */
export function loggerOptions(config: Config): LoggerOptions {
  return {
    level: config.LOG_LEVEL,
    base: {
      service: config.SERVICE_NAME,
      version: config.SERVICE_VERSION,
      region: config.DEPLOYMENT_REGION,
      env: config.NODE_ENV,
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        '*.password',
        '*.token',
        '*.passwordHash',
      ],
      censor: '[REDACTED]',
    },
  };
}
