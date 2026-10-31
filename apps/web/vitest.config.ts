import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ibc/kernel': fileURLToPath(new URL('../../packages/kernel/src/index.ts', import.meta.url)),
    },
  },
  test: { include: ['src/**/*.test.ts'] },
});
