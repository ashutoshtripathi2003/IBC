import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SERVICE_NAME: z.string().default('ibc-api'),
    SERVICE_VERSION: z.string().default('0.0.0-dev'),
    /** Deployment region label, e.g. "local", "ap-south-1". Used for observability and routing. */
    DEPLOYMENT_REGION: z.string().default('local'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /** Number of trusted reverse-proxy hops in front of the service (0 = trust none). */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
    CORS_ALLOWED_ORIGINS: csv,

    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(200).default(10),
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(100).default(5000),
    DATABASE_SSL: booleanString.default(false),

    SESSION_TTL_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(24 * 365)
      .default(24 * 30),
    /** scrypt cost as log2(N). OWASP minimum for scrypt is N=2^17. */
    PASSWORD_HASH_LOG2_COST: z.coerce.number().int().min(10).max(20).default(17),

    RATE_LIMIT_GLOBAL_PER_MINUTE: z.coerce.number().int().min(1).default(300),
    RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().int().min(1).default(10),

    /** Public URL of the web app; used to build links in emails. */
    APP_BASE_URL: z.url().default('http://localhost:3001'),
    AWS_REGION: z.string().default('ap-south-1'),
    EMAIL_TRANSPORT: z.enum(['log', 'ses']).default('log'),
    EMAIL_FROM: z.string().min(3).default('IBC <no-reply@localhost>'),
    SES_CONFIGURATION_SET: z.string().optional(),
    EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(240).default(30),

    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(50).default(1000),
    OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(20),
    EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(8),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.PASSWORD_HASH_LOG2_COST < 17) {
      ctx.addIssue({
        code: 'custom',
        path: ['PASSWORD_HASH_LOG2_COST'],
        message: 'must be at least 17 in production',
      });
    }
    if (env.NODE_ENV === 'production') {
      // The log transport prints one-time links; it must never run in production.
      if (env.EMAIL_TRANSPORT !== 'ses') {
        ctx.addIssue({
          code: 'custom',
          path: ['EMAIL_TRANSPORT'],
          message: 'must be "ses" in production',
        });
      }
      if (env.EMAIL_FROM.includes('localhost')) {
        ctx.addIssue({
          code: 'custom',
          path: ['EMAIL_FROM'],
          message: 'must be a real sender in production',
        });
      }
      if (!env.APP_BASE_URL.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['APP_BASE_URL'],
          message: 'must use https in production',
        });
      }
    }
  });

export type Config = z.infer<typeof envSchema>;

/** Parses and validates configuration. Fails fast with every problem listed. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${problems}`);
  }
  return result.data;
}
