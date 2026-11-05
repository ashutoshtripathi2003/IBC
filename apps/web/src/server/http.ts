import type { BffConfig } from './config';

/** Largest request body the BFF accepts (the API's own limit is 64 KiB; auth bodies are tiny). */
export const MAX_BODY_BYTES = 16 * 1024;

const NO_STORE = { 'cache-control': 'no-store' } as const;

/** RFC 9457 problem response with a stable code; never includes internal details. */
export function problem(
  status: number,
  code: string,
  detail: string,
  extra?: Record<string, string>,
) {
  return new Response(JSON.stringify({ type: 'about:blank', status, code, detail }), {
    status,
    headers: { 'content-type': 'application/problem+json', ...NO_STORE, ...extra },
  });
}

export function json(body: unknown, status = 200, extra?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...NO_STORE, ...extra },
  });
}

/**
 * Cross-site request forgery guard for state-changing requests. The session cookie is
 * SameSite=Lax; in addition the request must come from this site's own pages:
 * - `Sec-Fetch-Site`, when the browser sends it, must be `same-origin`;
 * - `Origin` must be present and equal to the site origin.
 * Returns a 403 response when the request is rejected, otherwise null.
 */
export function rejectCrossSite(request: Request, config: BffConfig): Response | null {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite !== null && fetchSite !== 'same-origin') {
    return problem(403, 'cross_site_request', 'This request must come from the IBC website.');
  }
  const origin = request.headers.get('origin');
  // Production requires IBC_SITE_ORIGIN (see config). Elsewhere the Host the browser used is
  // the site origin; a cross-site page cannot change the Host of a request to this server.
  const host = request.headers.get('host');
  const expected = config.siteOrigin ?? (host ? `${new URL(request.url).protocol}//${host}` : null);
  if (origin === null || expected === null || origin !== expected) {
    return problem(403, 'cross_site_request', 'This request must come from the IBC website.');
  }
  return null;
}

/**
 * Reads a JSON object body of at most MAX_BODY_BYTES, streaming so an oversized body is
 * rejected without buffering it. Returns the raw JSON text (the API validates the fields).
 */
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; text: string } | { ok: false; response: Response }> {
  const type = request.headers.get('content-type') ?? '';
  if (!/^application\/json(\s*;|$)/i.test(type)) {
    return { ok: false, response: problem(415, 'unsupported_media_type', 'Send JSON.') };
  }
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) {
    return { ok: false, response: problem(413, 'body_too_large', 'The request is too large.') };
  }
  if (!request.body) {
    return { ok: false, response: problem(400, 'invalid_body', 'The request body is empty.') };
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return { ok: false, response: problem(413, 'body_too_large', 'The request is too large.') };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
  } catch {
    return { ok: false, response: problem(400, 'invalid_body', 'The request body is not valid.') };
  }
  return { ok: true, text };
}

/**
 * The client IP to forward to the API, taken from X-Forwarded-For only as far as the
 * configured number of trusted proxies vouches for it. With no trusted proxies nothing is
 * forwarded (a client could otherwise spoof its address to dodge rate limits).
 */
export function clientIp(request: Request, trustedProxyHops: number): string | null {
  if (trustedProxyHops === 0) return null;
  const header = request.headers.get('x-forwarded-for');
  if (!header) return null;
  const hops = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  // Each trusted proxy appended the address it saw; the entry added by the outermost trusted
  // proxy is the client. Anything further left was supplied by the client and is ignored.
  const candidate = hops[hops.length - trustedProxyHops];
  if (!candidate || !/^[0-9a-fA-F:.]{2,45}$/.test(candidate)) return null;
  return candidate;
}
