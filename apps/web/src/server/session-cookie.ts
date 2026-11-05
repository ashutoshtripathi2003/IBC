/**
 * The session cookie holds the opaque API session token. It is httpOnly (never readable
 * by page scripts), SameSite=Lax, path-wide, and in production uses the `__Host-` prefix,
 * which the browser only accepts with Secure, Path=/ and no Domain (no subdomain can set or
 * read it).
 */
export function sessionCookieName(secure: boolean): string {
  return secure ? '__Host-ibc_session' : 'ibc_session';
}

/** Shape of session tokens issued by the API; anything else is never forwarded. */
export const SESSION_TOKEN_PATTERN = /^ibc_st_[A-Za-z0-9_-]{20,200}$/;

function attributes(secure: boolean): string {
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function setSessionCookie(token: string, expiresAt: string, secure: boolean): string {
  const expires = new Date(expiresAt);
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
  return `${sessionCookieName(secure)}=${token}; ${attributes(secure)}; Max-Age=${maxAge}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${sessionCookieName(secure)}=; ${attributes(secure)}; Max-Age=0`;
}

/** Reads the session token from the request's Cookie header, if well-formed. */
export function readSessionToken(request: Request, secure: boolean): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const name = sessionCookieName(secure);
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    return SESSION_TOKEN_PATTERN.test(value) ? value : null;
  }
  return null;
}
