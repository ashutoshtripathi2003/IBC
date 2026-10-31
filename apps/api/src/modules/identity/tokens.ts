import { createHash, randomBytes } from 'node:crypto';

/**
 * Bearer secrets are 256-bit random values with a recognisable prefix so leaked
 * values can be detected by secret scanners. Only the SHA-256 digest is stored;
 * a database leak does not reveal usable tokens.
 */
export const TokenPrefixes = {
  session: 'ibc_st_',
  emailVerification: 'ibc_ev_',
  passwordReset: 'ibc_pr_',
} as const;

export type TokenPrefix = (typeof TokenPrefixes)[keyof typeof TokenPrefixes];

export const SESSION_TOKEN_PREFIX = TokenPrefixes.session;

export function generateToken(prefix: TokenPrefix): string {
  return prefix + randomBytes(32).toString('base64url');
}

export function isWellFormedToken(token: string, prefix: TokenPrefix): boolean {
  return (
    token.length === prefix.length + 43 &&
    token.startsWith(prefix) &&
    /^[A-Za-z0-9_-]+$/.test(token.slice(prefix.length))
  );
}

export function generateSessionToken(): string {
  return generateToken(TokenPrefixes.session);
}

export function isWellFormedSessionToken(token: string): boolean {
  return isWellFormedToken(token, TokenPrefixes.session);
}

export function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

export const hashSessionToken = hashToken;
