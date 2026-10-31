import type { FastifyReply, FastifyRequest } from 'fastify';
import { Errors } from '../http/errors.js';
import { hasPermission, type Permission, type Principal } from './authorization.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated caller, resolved from the bearer token; null when anonymous. */
    principal: Principal | null;
  }
}

/** Returns the principal or throws 401. Use inside handlers of protected routes. */
export function requirePrincipal(request: FastifyRequest): Principal {
  if (!request.principal) throw Errors.unauthenticated();
  return request.principal;
}

/** preHandler: requires authentication and every listed permission. */
export function requirePermissions(...permissions: Permission[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const principal = requirePrincipal(request);
    for (const permission of permissions) {
      if (!hasPermission(principal, permission)) throw Errors.forbidden();
    }
  };
}

export function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  return match ? match[1]! : null;
}
