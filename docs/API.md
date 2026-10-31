# API

Base path for business APIs: `/v1`. JSON only (`content-type: application/json`; other
types → 415). Max body 64 KiB. All request bodies are strictly validated: unknown fields are
rejected with 400.

## Conventions

- **Authentication:** `Authorization: Bearer <session token>` (tokens start with `ibc_st_`).
- **Request IDs:** every response has `x-request-id`. A well-formed incoming `x-request-id`
  (8–128 chars of `[A-Za-z0-9._:-]`) is propagated; otherwise a UUIDv7 is generated.
- **Errors:** RFC 9457 `application/problem+json`:
  ```json
  {
    "type": "about:blank",
    "title": "Bad Request",
    "status": 400,
    "code": "validation_failed",
    "detail": "The request is invalid.",
    "errors": [{ "path": "email", "message": "..." }],
    "requestId": "..."
  }
  ```
  Clients should branch on `code`, never on `detail`.
- **Timestamps:** ISO 8601 UTC strings. **IDs:** UUID strings.
- **Rate limits:** global per client IP (default 300/min); auth endpoints stricter (default
  10/min). 429 responses include `retry-after`.
- Credential/personal responses from `/v1` carry `cache-control: no-store`.
- **Compatibility:** `/v1` is additive-only. Breaking changes require a new version and
  explicit approval.

## Error codes

| HTTP      | code                           | Meaning                                                      |
| --------- | ------------------------------ | ------------------------------------------------------------ |
| 400       | `validation_failed`            | Body/params invalid; see `errors[]`                          |
| 400       | `http_400`                     | Malformed JSON                                               |
| 401       | `unauthenticated`              | Missing/invalid/expired/revoked token                        |
| 401       | `invalid_credentials`          | Email or password wrong (identical for unknown accounts)     |
| 403       | `forbidden`                    | Authenticated but lacks permission                           |
| 403       | `account_inactive`             | Correct credentials, account suspended/deactivated           |
| 404       | `not_found`, `route_not_found` |                                                              |
| 409       | `email_taken`                  | Registration email already in use                            |
| 400       | `invalid_token`                | Verification/reset link unknown, used, expired or superseded |
| 429       | `too_many_requests`            | Too many verification emails for this account (5/hour)       |
| 413 / 415 | `http_413` / `http_415`        | Body too large / not JSON                                    |
| 429       | `rate_limited`                 | Per-IP rate limit                                            |
| 429       | `too_many_attempts`            | Per-account failed-login throttle (10 failures / 15 min)     |
| 500       | `internal_error`               | No internal details are returned                             |

## Endpoints (CURRENT)

### Health (no auth, not rate limited)

| Method | Path            | Response                                                                                                             |
| ------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health/live`  | 200 `{ "status": "ok" }` — process is alive                                                                          |
| GET    | `/health/ready` | 200 `{ status: "ready", service, version, region, checks: { database: "ok" } }`; 503 when DB unreachable or draining |

### Authentication

**POST `/v1/auth/register`** → 201

```json
// request
{ "email": "a@example.com", "password": "≥12 chars, ≤128", "displayName": "1–100 chars",
  "locale": "en-IN", "timezone": "Asia/Kolkata", "countryCode": "IN" }   // last three optional
// response
{ "user": User, "session": { "id": "uuid", "token": "ibc_st_…", "expiresAt": "…" } }
```

Defaults: `locale` `en`, `timezone` `UTC`, `countryCode` `null`. Locale is canonicalized
(`en-in` → `en-IN`); country is upper-cased. Emails are unique case-insensitively.

**POST `/v1/auth/login`** `{ email, password }` → 200 `{ user, session }` (a new session each time).

**POST `/v1/auth/logout`** (auth) → 204. Revokes the current session.

**GET `/v1/auth/sessions`** (auth) → 200
`{ sessions: [{ id, current, createdAt, lastSeenAt, expiresAt, ip, userAgent }] }`
(active sessions only; tokens are never returned).

**DELETE `/v1/auth/sessions/{sessionId}`** (auth) → 204. Only the caller's own sessions;
anything else returns 404.

### Email verification

Registration automatically sends a verification email. Links point to the web app
(`APP_BASE_URL`) as `/verify-email#token=…`; the token is in the URL fragment so it never
reaches server logs. The web app POSTs it to the API.

**POST `/v1/auth/email-verification`** (auth) → 202. Sends a fresh link (previous links stop
working). No-op if already verified. Max 5 per account per hour (`too_many_requests`).

**POST `/v1/auth/email-verification/confirm`** `{ token }` → 200 `{ user }`. No session needed.
Single use; expires after `EMAIL_VERIFICATION_TTL_HOURS` (default 24); fails if the account's
email changed after the link was sent. Emits `identity.user.email_verified`.

### Password reset

**POST `/v1/auth/password-reset`** `{ email }` → 202 with an empty body **whether or not the
account exists** (no enumeration). Active accounts receive a `/reset-password#token=…` link,
valid `PASSWORD_RESET_TTL_MINUTES` (default 30), max 5 per account per hour (excess requests
are silently dropped and audited).

**POST `/v1/auth/password-reset/confirm`** `{ token, newPassword }` → 204. Sets the new
password (same policy as registration), **signs out every session**, marks the email
verified (the reset proves mailbox control), clears the failed-login throttle, and sends a
"password changed" notice.

### Current user

**GET `/v1/me`** (auth) → 200 `{ user: User }`

**PATCH `/v1/me`** (auth) → 200 `{ user: User }`. Body: any of `displayName`, `locale`,
`timezone`, `countryCode` (`null` clears it). Email/status/roles cannot be changed here.

### `User`

```json
{
  "id": "uuid",
  "email": "a@example.com",
  "emailVerified": false,
  "displayName": "…",
  "status": "active",
  "locale": "en-IN",
  "timezone": "Asia/Kolkata",
  "countryCode": "IN",
  "createdAt": "…",
  "updatedAt": "…"
}
```

## TARGET

OpenAPI 3.1 document generated from the zod schemas and published with the service;
contract tests for web/mobile clients; cursor-based pagination convention; idempotency keys
(`Idempotency-Key` header) for all non-idempotent commerce operations (RFQ, order, payment).
