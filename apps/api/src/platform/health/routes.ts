import type { FastifyInstance } from 'fastify';
import type { Database } from '../db/database.js';

export interface HealthState {
  /** Set when the process is shutting down so load balancers stop routing to it. */
  draining: boolean;
}

/**
 * Liveness: the process is up and the event loop responds (no dependency checks,
 * so a database outage does not cause restart storms).
 * Readiness: the instance can serve traffic (database reachable, not draining).
 */
export async function healthRoutes(
  app: FastifyInstance,
  deps: { db: Database; state: HealthState; serviceName: string; version: string; region: string },
): Promise<void> {
  const routeConfig = { rateLimit: false } as const;

  app.get('/health/live', { config: routeConfig, logLevel: 'warn' }, async () => ({
    status: 'ok',
  }));

  app.get('/health/ready', { config: routeConfig, logLevel: 'warn' }, async (_request, reply) => {
    const checks: Record<string, 'ok' | 'fail'> = {};
    if (deps.state.draining) {
      return reply.code(503).send({ status: 'draining', checks });
    }
    try {
      await deps.db.ping(1000);
      checks.database = 'ok';
    } catch {
      checks.database = 'fail';
    }
    const ready = Object.values(checks).every((value) => value === 'ok');
    return reply.code(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not_ready',
      service: deps.serviceName,
      version: deps.version,
      region: deps.region,
      checks,
    });
  });
}
