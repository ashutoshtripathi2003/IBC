/**
 * Browser client for the website's own account endpoints (`/api/...`). Session tokens never
 * reach page scripts: the server keeps them in an httpOnly cookie.
 */

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  status: string;
  locale: string;
  timezone: string;
  countryCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  current: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  ip: string | null;
  userAgent: string | null;
}

export interface FieldError {
  path: string;
  message: string;
}

export class AccountError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
  }
}

/** Plain-language messages for the API's stable error codes. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'The email or password is not correct.',
  email_taken: 'An account with this email already exists. Log in, or reset your password.',
  too_many_attempts: 'Too many unsuccessful attempts. Wait 15 minutes, or reset your password.',
  rate_limited: 'Too many requests. Wait a minute and try again.',
  too_many_requests: 'You have asked for several emails already. Try again in an hour.',
  account_inactive: 'This account is not active. Contact IBC support.',
  invalid_token: 'This link is invalid or has expired. Request a new one.',
  unauthenticated: 'Your session has ended. Please log in again.',
  validation_failed: 'Some details need attention.',
  accounts_unavailable: 'Accounts are not open yet.',
  api_unavailable: 'IBC is temporarily unavailable. Please try again in a moment.',
  cross_site_request: 'Please reload the page and try again.',
};

async function call<T>(path: string, method: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
    });
  } catch {
    throw new AccountError(0, 'network', 'You appear to be offline. Check your connection.');
  }
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    errors?: FieldError[];
  };
  if (!response.ok) {
    const code = payload.code ?? 'unknown';
    throw new AccountError(
      response.status,
      code,
      MESSAGES[code] ?? 'Something went wrong. Please try again.',
      Array.isArray(payload.errors) ? payload.errors : [],
    );
  }
  return payload as T;
}

export const account = {
  session: () => call<{ accounts: boolean; user: User | null }>('/auth/session', 'GET'),
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    locale?: string;
    timezone?: string;
    countryCode?: string;
  }) => call<{ user: User }>('/auth/register', 'POST', input),
  login: (input: { email: string; password: string }) =>
    call<{ user: User }>('/auth/login', 'POST', input),
  logout: () => call<undefined>('/auth/logout', 'POST'),
  updateMe: (input: {
    displayName?: string;
    locale?: string;
    timezone?: string;
    countryCode?: string | null;
  }) => call<{ user: User }>('/me', 'PATCH', input),
  sessions: () => call<{ sessions: SessionInfo[] }>('/auth/sessions', 'GET'),
  revokeSession: (id: string) =>
    call<undefined>(`/auth/sessions/${encodeURIComponent(id)}`, 'DELETE'),
  resendVerification: () => call<undefined>('/auth/email-verification', 'POST'),
  confirmEmail: (token: string) =>
    call<{ user: User }>('/auth/email-verification/confirm', 'POST', { token }),
  requestPasswordReset: (email: string) =>
    call<undefined>('/auth/password-reset', 'POST', { email }),
  resetPassword: (token: string, newPassword: string) =>
    call<undefined>('/auth/password-reset/confirm', 'POST', { token, newPassword }),
};

/**
 * Only same-site, path-absolute destinations are allowed after sign-in (no open redirects:
 * `//evil.example`, `/\evil.example` and absolute URLs are rejected).
 */
export function safeNext(value: string | null | undefined, fallback = '/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  for (const char of value) if (char.charCodeAt(0) < 0x20) return fallback;
  return value;
}

/** Reads `token` from the URL fragment (emails put one-time tokens there, never in the query). */
export function tokenFromFragment(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const token = params.get('token');
  return token && /^[A-Za-z0-9_-]{10,300}$/.test(token) ? token : null;
}

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
