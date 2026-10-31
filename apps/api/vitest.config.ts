import { defineConfig } from 'vitest/config';
import { workspaceSourceAliases } from '../../vitest.shared.js';

export default defineConfig({
  resolve: { alias: workspaceSourceAliases },
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // Integration test files share one database; run files sequentially.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
