import { bffConfig, type BffConfig } from './config';
import { clientIp, json, problem, readJsonBody, rejectCrossSite } from './http';
import {
  clearSessionCookie,
  readSessionToken,
  SESSION_TOKEN_PATTERN,
  setSessionCookie,
} from './session-cookie';

const API_TIMEOUT_MS = 10_000;

export interface ProxyOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** API path under /v1, built only from fixed segments and validated parameters. */
  path: string;
  /** Send the session token; reply 401 without calling the API when there is none. */
  auth: boolean;
  /** Forward the JSON request body. */
  body: boolean;
  /**
   * How the API response affects the session cookie:
   * - `issue`: the API returned `{ user, session }`; store the token, return only `{ user }`;
   * - `end`: logout; the cookie is cleared whatever the API answers (fail safe);
   * - `ended-on-success`: password reset; the API signed out every session when it succeeded.
   */
  session?: 'issue' | 'end' | 'ended-on-success';
}

/** API down: generic 502; a logout still clears this browser's cookie. */
function unavailable(options: ProxyOptions, config: BffConfig) {
  return problem(
    502,
    'api_unavailable',
    'IBC is temporarily unavailable. Please try again.',
    options.session === 'end' ? { 'set-cookie': clearSessionCookie(config.secureCookies) } : {},
  );
}

const accountsUnavailable = () =>
  problem(503, 'accounts_unavailable', 'Accounts are not available yet.');

const unauthenticated = (config: BffConfig) =>
  problem(401, 'unauthenticated', 'Please log in.', {
    'set-cookie': clearSessionCookie(config.secureCookies),
  });

/**
 * Forwards one website request to one fixed IBC API operation. The browser never sees the
 * session token; the API stays the single authority for validation and authorization.
 */
export async function proxy(
  request: Request,
  options: ProxyOptions,
  config: BffConfig = bffConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (options.method !== 'GET') {
    const rejected = rejectCrossSite(request, config);
    if (rejected) return rejected;
  }
  if (!config.apiUrl) return accountsUnavailable();

  const token = readSessionToken(request, config.secureCookies);
  if (options.auth && !token) {
    if (options.session === 'end') {
      return new Response(null, {
        status: 204,
        headers: {
          'cache-control': 'no-store',
          'set-cookie': clearSessionCookie(config.secureCookies),
        },
      });
    }
    return unauthenticated(config);
  }

  let body: string | undefined;
  if (options.body) {
    const read = await readJsonBody(request);
    if (!read.ok) return read.response;
    body = read.text;
  }

  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (options.auth && token) headers.authorization = `Bearer ${token}`;
  const userAgent = request.headers.get('user-agent');
  if (userAgent) headers['user-agent'] = userAgent.slice(0, 512);
  const ip = clientIp(request, config.trustedProxyHops);
  if (ip) headers['x-forwarded-for'] = ip;

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${config.apiUrl}/v1${options.path}`, {
      method: options.method,
      headers,
      ...(body === undefined ? {} : { body }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch {
    return unavailable(options, config);
  }

  if (upstream.status >= 500) return unavailable(options, config);

  const extra: Record<string, string> = {};
  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter && /^\d{1,6}$/.test(retryAfter)) extra['retry-after'] = retryAfter;

  // An expired or revoked session: drop the cookie so the site shows the signed-out state.
  if (upstream.status === 401 && options.auth) {
    extra['set-cookie'] = clearSessionCookie(config.secureCookies);
  }
  if (
    options.session === 'end' ||
    (options.session === 'ended-on-success' && (upstream.ok || upstream.status === 401))
  ) {
    extra['set-cookie'] = clearSessionCookie(config.secureCookies);
  }

  const text = await upstream.text();
  // 202/204 answers carry no body.
  if (upstream.status === 204 || (text === '' && upstream.ok)) {
    return new Response(null, {
      status: upstream.status,
      headers: { 'cache-control': 'no-store', ...extra },
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return problem(502, 'api_unavailable', 'IBC is temporarily unavailable. Please try again.');
  }

  if (!upstream.ok) {
    const type = upstream.headers.get('content-type') ?? 'application/problem+json';
    return new Response(JSON.stringify(payload), {
      status: upstream.status,
      headers: {
        'content-type': type.includes('problem+json') ? type : 'application/problem+json',
        'cache-control': 'no-store',
        ...extra,
      },
    });
  }

  if (options.session === 'issue') {
    const issued = payload as {
      user?: unknown;
      session?: { token?: unknown; expiresAt?: unknown };
    };
    const sessionToken = issued.session?.token;
    const expiresAt = issued.session?.expiresAt;
    if (
      typeof sessionToken !== 'string' ||
      !SESSION_TOKEN_PATTERN.test(sessionToken) ||
      typeof expiresAt !== 'string' ||
      Number.isNaN(Date.parse(expiresAt))
    ) {
      return problem(502, 'api_unavailable', 'IBC is temporarily unavailable. Please try again.');
    }
    // The token goes only into the httpOnly cookie, never into the response body.
    return json({ user: issued.user }, upstream.status, {
      ...extra,
      'set-cookie': setSessionCookie(sessionToken, expiresAt, config.secureCookies),
    });
  }

  return json(payload, upstream.status, extra);
}

/** The signed-in user, or `{ user: null }`; tells the site whether accounts are available. */
export async function currentSession(
  request: Request,
  config: BffConfig = bffConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!config.apiUrl) return json({ accounts: false, user: null });
  if (!readSessionToken(request, config.secureCookies)) return json({ accounts: true, user: null });
  const response = await proxy(
    request,
    { method: 'GET', path: '/me', auth: true, body: false },
    config,
    fetchImpl,
  );
  if (response.status === 401) {
    return json({ accounts: true, user: null }, 200, {
      'set-cookie': clearSessionCookie(config.secureCookies),
    });
  }
  if (!response.ok) return response;
  const { user } = (await response.json()) as { user: unknown };
  return json({ accounts: true, user });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Path parameters are validated before they reach an API URL (no path traversal). */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
