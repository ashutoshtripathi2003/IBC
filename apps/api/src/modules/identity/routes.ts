import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Permissions } from '../../platform/authz/authorization.js';
import { requirePermissions, requirePrincipal } from '../../platform/authz/http.js';
import { parseInput } from '../../platform/http/validation.js';
import type { UserRecord } from './repository.js';
import {
  confirmEmailVerificationSchema,
  confirmPasswordResetSchema,
  loginSchema,
  requestPasswordResetSchema,
  registerSchema,
  sessionIdParamsSchema,
  updateProfileSchema,
} from './schemas.js';
import type { IdentityService, IssuedSession, RequestContext } from './service.js';

function requestContext(request: FastifyRequest): RequestContext {
  return {
    requestId: request.id,
    ip: request.ip || null,
    userAgent: request.headers['user-agent'] ?? null,
  };
}

/** Public representation of the caller's own account. */
function userDto(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    displayName: user.displayName,
    status: user.status,
    locale: user.locale,
    timezone: user.timezone,
    countryCode: user.countryCode,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function sessionDto(session: IssuedSession) {
  return { id: session.id, token: session.token, expiresAt: session.expiresAt.toISOString() };
}

export async function identityRoutes(
  app: FastifyInstance,
  deps: { service: IdentityService; authRateLimitPerMinute: number },
): Promise<void> {
  const { service } = deps;
  const authRateLimit = { rateLimit: { max: deps.authRateLimitPerMinute, timeWindow: '1 minute' } };
  // Responses carrying credentials or personal data must never be cached.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('cache-control', 'no-store');
  });

  app.post('/auth/register', { config: authRateLimit }, async (request, reply) => {
    const input = parseInput(registerSchema, request.body);
    const { user, session } = await service.register(input, requestContext(request));
    return reply.code(201).send({ user: userDto(user), session: sessionDto(session) });
  });

  app.post('/auth/login', { config: authRateLimit }, async (request) => {
    const input = parseInput(loginSchema, request.body);
    const { user, session } = await service.login(input, requestContext(request));
    return { user: userDto(user), session: sessionDto(session) };
  });

  app.post('/auth/logout', async (request, reply) => {
    await service.logout(requirePrincipal(request), requestContext(request));
    return reply.code(204).send();
  });

  app.get(
    '/auth/sessions',
    { preHandler: requirePermissions(Permissions.SelfSessionsManage) },
    async (request) => {
      const sessions = await service.listSessions(requirePrincipal(request));
      return {
        sessions: sessions.map((session) => ({
          id: session.id,
          current: session.current,
          createdAt: session.createdAt.toISOString(),
          lastSeenAt: session.lastSeenAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          ip: session.ip,
          userAgent: session.userAgent,
        })),
      };
    },
  );

  app.delete(
    '/auth/sessions/:sessionId',
    { preHandler: requirePermissions(Permissions.SelfSessionsManage) },
    async (request, reply) => {
      const { sessionId } = parseInput(sessionIdParamsSchema, request.params);
      await service.revokeSession(requirePrincipal(request), sessionId, requestContext(request));
      return reply.code(204).send();
    },
  );

  app.get('/me', { preHandler: requirePermissions(Permissions.SelfRead) }, async (request) => ({
    user: userDto(await service.getCurrentUser(requirePrincipal(request))),
  }));

  app.patch('/me', { preHandler: requirePermissions(Permissions.SelfUpdate) }, async (request) => {
    const patch = parseInput(updateProfileSchema, request.body);
    const user = await service.updateProfile(
      requirePrincipal(request),
      patch,
      requestContext(request),
    );
    return { user: userDto(user) };
  });

  app.post(
    '/auth/email-verification',
    { config: authRateLimit, preHandler: requirePermissions(Permissions.SelfUpdate) },
    async (request, reply) => {
      await service.requestEmailVerification(requirePrincipal(request), requestContext(request));
      return reply.code(202).send();
    },
  );

  app.post('/auth/email-verification/confirm', { config: authRateLimit }, async (request) => {
    const { token } = parseInput(confirmEmailVerificationSchema, request.body);
    const user = await service.confirmEmailVerification(token, requestContext(request));
    return { user: userDto(user) };
  });

  app.post('/auth/password-reset', { config: authRateLimit }, async (request, reply) => {
    const { email } = parseInput(requestPasswordResetSchema, request.body);
    await service.requestPasswordReset(email, requestContext(request));
    // Same response whether or not the account exists.
    return reply.code(202).send();
  });

  app.post('/auth/password-reset/confirm', { config: authRateLimit }, async (request, reply) => {
    const { token, newPassword } = parseInput(confirmPasswordResetSchema, request.body);
    await service.confirmPasswordReset(token, newPassword, requestContext(request));
    return reply.code(204).send();
  });
}
