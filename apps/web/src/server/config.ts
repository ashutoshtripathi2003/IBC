/**
 * Server-only configuration for the website's backend-for-frontend (BFF) routes.
 * Read on every call so tests and deployments can change it without a rebuild.
 */
export interface BffConfig {
  /** Base URL of the IBC API (server-to-server), e.g. http://localhost:3000. Unset = accounts off. */
  apiUrl: string | null;
  /** The website's public origin (e.g. https://ibc.example). Unset = the request's own origin. */
  siteOrigin: string | null;
  /**
   * Reverse-proxy hops in front of the website whose X-Forwarded-For entries are trusted
   * (0 = trust none: the client IP is not forwarded to the API).
   */
  trustedProxyHops: number;
  /** Secure (__Host-) cookies. On for production builds. */
  secureCookies: boolean;
}

function origin(value: string | undefined, name: string): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`);
  }
  return url.origin;
}

export function bffConfig(env: NodeJS.ProcessEnv = process.env): BffConfig {
  const hops = Number(env.IBC_TRUSTED_PROXY_HOPS ?? '0');
  if (!Number.isInteger(hops) || hops < 0 || hops > 10) {
    throw new Error('IBC_TRUSTED_PROXY_HOPS must be an integer from 0 to 10');
  }
  const apiUrl = origin(env.IBC_API_URL, 'IBC_API_URL');
  const siteOrigin = origin(env.IBC_SITE_ORIGIN, 'IBC_SITE_ORIGIN');
  // Production does not infer the site origin from request headers: fail closed instead.
  if (env.NODE_ENV === 'production' && apiUrl && !siteOrigin) {
    throw new Error('IBC_SITE_ORIGIN must be set in production when IBC_API_URL is set');
  }
  return {
    apiUrl,
    siteOrigin,
    trustedProxyHops: hops,
    secureCookies: env.NODE_ENV === 'production',
  };
}
