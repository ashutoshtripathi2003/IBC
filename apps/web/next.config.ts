import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
/** Origin of the IBC API, allowed for fetch() once the website calls it directly. */
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? '';

/**
 * Content Security Policy. Next.js injects inline bootstrap scripts into statically
 * generated pages, so 'unsafe-inline' is required for scripts unless pages become
 * dynamically rendered with per-request nonces. No third-party origins are allowed.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}${isDev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // The monorepo root, so standalone output traces workspace dependencies correctly.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
};

export default config;
