# Security

Security is a Day-1 requirement. This document records what is implemented (CURRENT), what
is planned (TARGET), and known gaps. It makes no compliance or certification claims.

## Reporting

**OPEN QUESTION (founder):** a security contact address and disclosure policy are needed
before public launch.

## CURRENT controls

### Authentication

- Passwords: length-based policy (12–128 chars, NIST SP 800-63B style; no composition rules),
  hashed with **scrypt** (N=2^17, r=8, p=1 — OWASP baseline; production config refuses
  lower), 16-byte random salt, Unicode NFC normalization, constant-time comparison.
  Self-describing hash format; weaker hashes are transparently upgraded at next login.
- Unknown-account logins verify against a dummy hash so timing does not reveal whether an
  email is registered; responses for "unknown account" and "wrong password" are identical.
- Sessions: 256-bit random opaque tokens with an `ibc_st_` prefix (detectable by secret
  scanners). Only the SHA-256 digest is stored. Server-side expiry (default 30 days),
  revocation on logout, per-session revocation by the owner, and all sessions invalid as
  soon as an account is not `active`.
- Brute force: per-IP rate limit on auth endpoints + per-account throttle (10 failures in 15
  minutes → 429, even with the correct password), backed by the database so it holds across
  instances.

### Account recovery and verification

- Email verification and password reset use single-use, 256-bit tokens (`ibc_ev_`/`ibc_pr_`
  prefixes), hashed at rest, short-lived (24 h / 30 min), invalidated when a newer one is issued.
- Links carry the token in the URL fragment (not sent to servers, not in Referer headers).
- Password-reset requests answer identically for unknown accounts; per-account cap of 5
  emails/hour (anti email-bombing) on both flows.
- Completing a reset revokes all sessions and sends a "password changed" notice; failed-login
  throttling restarts from the password change.
- Emails are sent asynchronously from a DB outbox; bodies (which contain links) are purged
  after delivery. The development log transport is rejected by production config.

### Authorization

- Deny-by-default RBAC; role → permission map is code (reviewed, tested).
- Resource ownership enforced in queries (e.g. session revocation filters by `user_id`);
  other users' resources read as 404 to avoid enumeration.
- Clients cannot set roles/status: strict input schemas reject unknown fields.

### Input/output

- zod validation on every body and path parameter; JSON-only; 64 KiB body cap.
- Parameterized SQL everywhere (no string-built queries with user input).
- RFC 9457 errors; 5xx responses never include internal details.
- Security headers via helmet: CSP `default-src 'none'; frame-ancestors 'none'`, HSTS,
  `nosniff`, CORP same-site, no `x-powered-by`. CORS is disabled unless origins are
  explicitly allow-listed; no credentialed CORS.
- `cache-control: no-store` on identity responses.

### Audit and logging

- Append-only `audit.security_events` (DB trigger blocks UPDATE/DELETE): registration,
  login success/failure/denied (with reason), logout, session revocation; with IP,
  user-agent and request ID.
- Structured logs redact authorization headers, cookies, and password/token fields; request
  bodies are not logged.

### Observability data

- Trace spans record SQL statement text with bind placeholders only — never parameter values
  (`enhancedDatabaseReporting: false`); verified by a test that searches exported spans for
  the email, password and session token.
- Health checks are not traced. Tracing is off unless an OTLP endpoint is configured.
- `/openapi.json` is public: it describes the API surface but contains no data or secrets.

### Supply chain and repository

- Lockfile (`pnpm-lock.yaml`) with `--frozen-lockfile` in CI; `engine-strict`.
- Only explicitly allowed dependency build scripts (`onlyBuiltDependencies`).
- CI: `pnpm audit --prod --audit-level=moderate` (prod deps must be clean),
  `pnpm audit --audit-level=high` (dev tooling), gitleaks secret scanning, Dependabot.
- Container: runs as non-root `node` user; production-only dependencies.
- `.env*` files are git-ignored; configuration is validated at startup.

### Website

- Security headers on every response: CSP (`default-src 'self'`, no third-party origins,
  `frame-ancestors 'none'`, `object-src 'none'`), HSTS, `nosniff`, strict referrer policy,
  restrictive Permissions-Policy, COOP; no `x-powered-by`. Verified by an e2e test.
- Fonts and assets are self-hosted; the site makes no third-party requests.

## Known gaps / risks (tracked)

| Gap                                                                                               | Plan                                                                                                         |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Registration returns 409 for existing emails (signup-based enumeration, mitigated by rate limits) | Switch to always-202 + email; changes `/v1` behaviour — **founder approval needed**                          |
| Unverified emails are not yet restricted from any action                                          | Decide which actions require a verified email once features exist                                            |
| Email bodies with live links sit in `platform.email_outbox` until sent (minutes)                  | DB encryption at rest (RDS) + body purge on send; consider envelope encryption                               |
| No MFA, passkeys, OIDC sign-in                                                                    | TARGET: TOTP + WebAuthn/passkeys next; OIDC (Google/Microsoft/LinkedIn) later                                |
| No breached-password check                                                                        | Add k-anonymity check (HIBP range API) or offline list                                                       |
| Per-IP rate limit store is per instance                                                           | Redis-backed limiter before running >1 replica                                                               |
| Account-throttle can be abused to temporarily lock a victim out                                   | Accepted trade-off; revisit with risk-based challenges/CAPTCHA                                               |
| No bot protection/WAF                                                                             | Edge WAF + bot management at deployment                                                                      |
| Session tokens not bound to device; no device management UI                                       | TARGET device registry                                                                                       |
| scrypt runs on libuv threadpool (4 threads default) — CPU-bound under login bursts                | Tune `UV_THREADPOOL_SIZE`, horizontal scaling; load test                                                     |
| Dev-only advisory: `minimatch` (via ESLint) GHSA-g3hv-75wg-m249, moderate                         | No fix within ESLint's supported range yet; not shipped in production image; Dependabot will surface the fix |
| No secrets manager, encryption-at-rest config, key rotation                                       | Cloud decision pending                                                                                       |
| GitHub Actions pinned by major tag, not SHA                                                       | Pin to SHAs before org-wide rollout                                                                          |

## Rules (non-negotiable)

Never commit secrets · never log tokens/passwords · never trust client-side authorization ·
never disable security checks to pass tests · security-sensitive changes get a security
review before merge.
