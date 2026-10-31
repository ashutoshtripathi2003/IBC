import { identityOperations } from './modules/identity/openapi.js';
import { healthOperations } from './platform/health/openapi.js';
import { buildOpenApiDocument, type ApiOperation } from './platform/http/openapi.js';

/** Version of the published HTTP contract (not the build). Bump minor for additive changes. */
export const API_CONTRACT_VERSION = '1.1.0';

/** Every documented operation. `test/openapi.test.ts` checks this matches the registered routes. */
export const apiOperations: readonly ApiOperation[] = [...healthOperations, ...identityOperations];

export function apiDocument(): Record<string, unknown> {
  return buildOpenApiDocument({ version: API_CONTRACT_VERSION, operations: apiOperations });
}
