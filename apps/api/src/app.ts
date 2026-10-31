import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { LogController, type FastifyError, type FastifyInstance } from 'fastify';
import { registerIdentityModule } from './modules/identity/index.js';
import type { Config } from './platform/config.js';
import type { Database } from './platform/db/database.js';
import { healthRoutes, type HealthState } from './platform/health/routes.js';
import { AppError } from './platform/http/errors.js';
import { generateRequestId } from './platform/http/request-id.js';
import { loggerOptions } from './platform/logger.js';

export interface AppDependencies {
  config: Config;
  db: Database;
  healthState?: HealthState;
}

/** Composition root: wires platform capabilities and domain modules into one HTTP app. */
export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {
  const { config, db } = deps;
  const healthState = deps.healthState ?? { draining: false };

  const app = Fastify({
    logger: loggerOptions(config),
    genReqId: generateRequestId,
    logController: new LogController({ requestIdLogLabel: 'requestId' }),
    // Trust X-Forwarded-For only for the configured number of proxy hops (edge, load balancer).
    trustProxy: (_address: string, hop: number) => hop < config.TRUST_PROXY_HOPS,
    bodyLimit: 64 * 1024,
    connectionTimeout: 30_000,
    requestTimeout: 30_000,
    // Clients cannot pick arbitrary routes by case/trailing slash variations.
    routerOptions: { caseSensitive: true, ignoreTrailingSlash: false },
  });

  // JSON only: drop the default text/plain parser so other content types get 415.
  app.removeContentTypeParser('text/plain');

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    const problem = toProblem(error);
    if (problem.status >= 500) {
      request.log.error({ err: error }, 'unhandled error');
    } else {
      request.log.info({ code: problem.code, status: problem.status }, 'request rejected');
    }
    return reply
      .code(problem.status)
      .type('application/problem+json')
      .send({ ...problem, requestId: request.id });
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .type('application/problem+json')
      .send({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        code: 'route_not_found',
        detail: `No route for ${request.method} ${request.url.split('?')[0]}`,
        requestId: request.id,
      }),
  );

  await app.register(helmet, {
    // JSON API: forbid everything a browser might try to render from a response.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
  });

  await app.register(cors, {
    origin: config.CORS_ALLOWED_ORIGINS.length > 0 ? config.CORS_ALLOWED_ORIGINS : false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['authorization', 'content-type', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    credentials: false,
    maxAge: 600,
  });

  // In-process store: limits apply per instance. Move to Redis before running >1 replica.
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_GLOBAL_PER_MINUTE,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      statusCode: context.statusCode,
      code: 'rate_limited',
      message: `Rate limit exceeded. Retry in ${Math.ceil(context.ttl / 1000)} seconds.`,
    }),
  });

  await app.register(healthRoutes, {
    db,
    state: healthState,
    serviceName: config.SERVICE_NAME,
    version: config.SERVICE_VERSION,
    region: config.DEPLOYMENT_REGION,
  });

  registerIdentityModule(app, {
    db,
    config: {
      sessionTtlHours: config.SESSION_TTL_HOURS,
      passwordHashLog2Cost: config.PASSWORD_HASH_LOG2_COST,
    },
    authRateLimitPerMinute: config.RATE_LIMIT_AUTH_PER_MINUTE,
  });

  return app;
}

interface Problem {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  errors?: { path: string; message: string }[];
}

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

function toProblem(error: FastifyError | AppError | Error): Problem {
  if (error instanceof AppError) {
    return {
      type: 'about:blank',
      title: STATUS_TITLES[error.status] ?? 'Error',
      status: error.status,
      code: error.code,
      detail: error.message,
      ...(error.fieldErrors ? { errors: error.fieldErrors } : {}),
    };
  }
  const status = (error as FastifyError).statusCode;
  if (status && status >= 400 && status < 500) {
    // Framework-level client errors (malformed JSON, body too large, rate limit, ...).
    const code = (error as { code?: string }).code;
    return {
      type: 'about:blank',
      title: STATUS_TITLES[status] ?? 'Error',
      status,
      code: code === 'rate_limited' ? code : `http_${status}`,
      detail: error.message,
    };
  }
  // Never leak internal error details to clients.
  return {
    type: 'about:blank',
    title: STATUS_TITLES[500]!,
    status: 500,
    code: 'internal_error',
    detail: 'An unexpected error occurred.',
  };
}
