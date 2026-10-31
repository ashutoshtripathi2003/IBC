/**
 * Identity module — public interface.
 *
 * Owns: user accounts, credentials, sessions, platform roles (`identity` schema).
 * Other modules may import only from this file, never from the module's internals.
 */
import type { FastifyInstance } from 'fastify';
import type { Database } from '../../platform/db/database.js';
import { bearerToken } from '../../platform/authz/http.js';
import { identityRoutes } from './routes.js';
import { createIdentityService, type IdentityConfig } from './service.js';

export { IdentityEvents, type UserCreatedV1, type UserProfileUpdatedV1 } from './events.js';
export type { IdentityService } from './service.js';

export function registerIdentityModule(
  app: FastifyInstance,
  deps: { db: Database; config: IdentityConfig; authRateLimitPerMinute: number },
) {
  const service = createIdentityService({ db: deps.db, config: deps.config, logger: app.log });

  // Resolve the caller on every request; routes decide whether auth is required.
  app.decorateRequest('principal', null);
  app.addHook('onRequest', async (request) => {
    const token = bearerToken(request);
    request.principal = token ? await service.authenticate(token) : null;
  });

  app.register(identityRoutes, {
    prefix: '/v1',
    service,
    authRateLimitPerMinute: deps.authRateLimitPerMinute,
  });
  return service;
}
