import { fileURLToPath } from 'node:url';

/**
 * Tests run against workspace package sources (not built `dist/`), so a change in
 * `packages/*` is picked up without a build step. Mirrors the `@ibc/source` export condition.
 */
export const workspaceSourceAliases = {
  '@ibc/kernel': fileURLToPath(new URL('./packages/kernel/src/index.ts', import.meta.url)),
};
