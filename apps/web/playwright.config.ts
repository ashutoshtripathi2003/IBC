import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.WEB_E2E_PORT ?? 3101);

/**
 * End-to-end tests run against the production build (`next start`), on a desktop
 * browser and a Galaxy S23-class phone viewport.
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
  webServer: {
    command: `pnpm exec next start --port ${PORT} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
