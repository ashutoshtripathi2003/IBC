import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.WEB_E2E_PORT ?? 3101);
const API_PORT = Number(process.env.API_E2E_PORT ?? 3102);
/** A dedicated database: the API's own integration tests rebuild `ibc_test`. */
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://ibc:ibc_dev_password@localhost:5432/ibc_e2e_test';

/**
 * End-to-end tests run against the production build (`next start`) with the real IBC API and
 * PostgreSQL behind it, on a desktop browser and a Galaxy S23-class phone viewport.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Galaxy S9+'],
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
      },
    },
  ],
  webServer: [
    {
      // Migrates the e2e database, then runs the API from sources.
      command:
        'pnpm --filter @ibc/api db:migrate && pnpm --filter @ibc/api exec tsx --conditions=@ibc/source src/main.ts',
      url: `http://127.0.0.1:${API_PORT}/health/ready`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        LOG_LEVEL: 'warn',
        EMAIL_TRANSPORT: 'log',
        APP_BASE_URL: `http://127.0.0.1:${PORT}`,
        // Many sign-ups from one machine: relax only the per-IP limits, never the checks.
        RATE_LIMIT_AUTH_PER_MINUTE: '1000',
        RATE_LIMIT_GLOBAL_PER_MINUTE: '10000',
        PASSWORD_HASH_LOG2_COST: '14',
      },
    },
    {
      command: `pnpm exec next start --port ${PORT} --hostname 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        IBC_API_URL: `http://127.0.0.1:${API_PORT}`,
        IBC_SITE_ORIGIN: `http://127.0.0.1:${PORT}`,
      },
    },
  ],
});
