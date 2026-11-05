# Backend build plan

> **Status: PROPOSAL.** This is the order in which the remaining domains are built on the
> existing foundation. Each step follows the "Adding a domain module" checklist in
> `ENGINEERING.md` and ships with migrations, tests (integration on real PostgreSQL),
> OpenAPI, docs and a security review. Items marked **DECISION** need the founder before
> that step starts. Nothing here is built yet unless it says CURRENT.

## Foundation already in place (CURRENT)

- Identity: accounts, scrypt passwords, opaque hashed sessions, RBAC, email verification,
  password reset, rate limits, account throttling, append-only security audit.
- Platform: forward-only checksummed migrations, transactional outbox + relay, email outbox
  (SES), OpenTelemetry tracing, OpenAPI from zod, RFC 9457 errors.
- Website ↔ API: the website's server (BFF) holds the session token in an httpOnly cookie and
  forwards a fixed allow-list of operations (see `SECURITY.md` → Website accounts).

## Build order

Each step unlocks a part of the website that today runs on labelled demo data.

| #   | Module (schema)              | What it adds                                                                                                                                                                  | Website it replaces                         |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | `profile`                    | Professional profile per user: headline, roles (several; at a company or another organisation), expertise, industries, interests, visibility                                  | `/network/[slug]`, My Profile               |
| 2   | `organization`               | Companies: legal/display name, business types, industries, locations (ISO country, generic address), registration/tax identifiers (generic), members + org roles, invitations | `/businesses`, company pages, My Businesses |
| 3   | `catalog`                    | Products and services owned by an organization: specs (typed key/values with units), `Money` price or price-on-request, MOQ, availability, ships-from, media                  | `/products`, `/services`, product pages     |
| 4   | `search` (derived)           | Search index built from catalog/organization/profile events (PostgreSQL full-text first; OpenSearch when scale requires), rebuildable                                         | `/search`, Discover, Explorer filters       |
| 5   | `trade`                      | RFQ → quote → compare (negotiate/order later); idempotency keys; per-party visibility                                                                                         | Request quotation, RFQs                     |
| 6   | `network`                    | Connections and follows (person↔person, person↔company), requests, blocking                                                                                                   | Connect, My Network                         |
| 7   | `messaging`                  | Conversations between connected parties and RFQ participants; abuse controls                                                                                                  | Messages                                    |
| 8   | `notification`               | In-app + email notifications from domain events, preferences                                                                                                                  | Notifications                               |
| 9   | `trust`                      | Verification records (who checked what, against which source, when, expiry); the Verified badge reads only from here                                                          | Verified badges                             |
| 10  | `content`, `opportunity`     | Posts; tenders/partnership requests                                                                                                                                           | Posts, Opportunities                        |
| —   | Payments, orders, reputation | Later; payments likely an isolated service (ARCHITECTURE §3)                                                                                                                  |                                             |

## Rules every module follows

- **Authorization in the API, never the client.** Deny by default; resource ownership in the
  query (`WHERE organization_id = $1 AND …`); other tenants' rows read as 404.
- **Organization-scoped permissions**: org roles (owner, admin, member) checked server-side for
  every write to company, catalog and trade data. Platform roles stay in identity.
- **Strict input**: zod strict objects via `parseInput`; lengths and enums bounded; URLs and
  media validated; no HTML stored as markup (plain text + structured fields).
- **Global-first data**: `Money` (`amount_minor bigint`, `currency char(3)`), ISO 3166-1
  countries, IANA time zones, BCP 47 locales, generic registration/tax identifier
  (`scheme`, `value`, `country`) — never GST/PAN/CIN-specific columns.
- **Events in the same transaction** for every change other domains need (search indexing,
  notifications); payloads exclude secrets and contact PII; consumers idempotent.
- **Pagination**: cursor-based (`?cursor=&limit=`, limit capped) on every list.
- **Abuse**: per-user and per-IP rate limits on writes; audit of security-relevant actions
  (membership/role changes, verification decisions).
- **Media uploads** (step 3): direct-to-S3 presigned uploads with size/type limits, malware
  scanning before publication, served from a separate cookieless domain.

## Decisions needed before the relevant step

1. **Profile visibility** (step 1): are profiles public to anyone, to members only, or
   per-field? (affects SEO and privacy).
2. **Company ownership** (step 2): who may create a company page, and how a claim on an
   existing name is resolved.
3. **Verification** (step 9, also PRODUCT open question): what "verified" means for a person
   and for a company at launch, and which documents/sources are checked.
4. **RFQ visibility** (step 5): direct to one supplier only, or also broadcast to matching
   suppliers?
5. **Terms of service and privacy policy** — needed before sign-up opens to the public
   (registration currently records no consent).
6. **Phone/OTP sign-in** for the Indian market (ENGINEERING open question 4).
