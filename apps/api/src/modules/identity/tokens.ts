import { createHash, randomBytes } from 'node:crypto';

/**
 * Session tokens are 256-bit random values with a recognisable prefix so leaked
 * tokens can be detected by secret scanners. Only the SHA-256 digest is stored;
 * a database leak does not reveal usable tokens.
 */
export const SESSION_TOKEN_PREFIX = 'ibc_st_';
const TOKEN_PATTERN = /^ibc_st_[A-Za-z0-9_-]{43}$/;

export function generateSessionToken(): string {
  return SESSION_TOKEN_PREFIX + randomBytes(32).toString('base64url');
}

export function isWellFormedSessionToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function hashSessionToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}
