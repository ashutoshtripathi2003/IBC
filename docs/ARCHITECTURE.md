# Architecture

Status legend: **CURRENT** = implemented in this repository · **TARGET** = intended, not built ·
**DECISION** = adopted choice (with rationale) · **ASSUMPTION** · **OPEN QUESTION**.

## 1. Principles

- Build for global scale, launch for local density: global-grade boundaries and data model,
  right-sized capacity (one region, few replicas) until load justifies more.
- PostgreSQL is the transactional source of truth. Everything else (search, cache,
  analytics, recommendations, AI) is derived, rebuildable, and allowed to fail without
  taking down core flows.
- Strong domain boundaries first; physical service splits only when justified.

## 2. CURRENT state (what exists today)

```
                ┌────────────────────────── apps/api (one deployable image) ─────────────────────────┐
  HTTP client → │ Fastify: request-id · helmet · CORS · rate limit · problem+json errors              │
                │   ├─ platform/health      /health/live, /health/ready                               │
                │   └─ modules/identity     /v1/auth/*, /v1/me   (owns schema `identity`)              │
                │ platform: config · db (pg pool, tx) · migrator · outbox · audit · authz · logger    │
                └───────────────┬────────────────────────────────────────────────────────────────────┘
                                │ SQL (own schemas only)
                         ┌──────▼──────┐   outbox rows    ┌──────────────────────┐
                         │ PostgreSQL  │ ───────────────▶ │ worker (outbox relay)│ ──▶ publisher
                         │ identity.*  │  SKIP LOCKED     │ dist/worker.js        │    (log today,
                         │ platform.*  │                  └──────────────────────┘     Kafka target)
                         │ audit.*     │
                         └─────────────┘
```

The same container image runs three process types: API (`dist/main.js`), outbox worker
(`dist/worker.js`), and migrations (`dist/migrate.js`, run as a deploy step).

### Repository layout (CURRENT)

```
apps/api/                 Platform API service
  migrations/             Forward-only SQL migrations (NNNN_name.sql)
  src/app.ts              Composition root (wires platform + modules)
  src/main.ts             HTTP entrypoint (graceful shutdown, readiness draining)
  src/worker.ts           Outbox relay entrypoint
  src/migrate.ts          Migration entrypoint
  src/platform/           Domain-agnostic capabilities — must not import modules/
  src/modules/<domain>/   Domain modules; public surface is index.ts only
  test/                   Integration + architecture tests (real PostgreSQL)
packages/kernel/          Runtime-neutral primitives (UUIDv7, Money, globalization)
infra/local/              Local-dev infrastructure helpers
docs/                     This documentation
```

## 3. DECISION: modular service, not a monolith or microservice sprawl

**Decision.** Domains are implemented as strictly-bounded modules inside the platform API
service. Each module owns a PostgreSQL schema, exposes a public `index.ts`, and publishes
versioned events. A module is extracted into its own deployable only when there is a
concrete reason (see "When to split").

**Why.** The brief rules out both a giant monolith and dozens of meaningless
microservices. With no production traffic yet, network hops, distributed transactions and
per-service operational overhead would cost velocity and reliability without benefit.
Boundaries enforced in code (and by `test/architecture.test.ts`) keep extraction a
mechanical change rather than a rewrite: data is already separated by schema, and
cross-domain communication already goes through interfaces and events.

**Enforced rules (CURRENT, tested):**

1. `platform/` never imports from `modules/`.
2. A module imports another module only via that module's `index.ts`.
3. Only the owning module references its schema in SQL.

**When to split a module into its own service (TARGET criteria):** materially different
scaling profile (e.g. messaging/WebSockets), different runtime needs (e.g. Go for
high-throughput matching), independent release cadence needed by a separate team,
fault-isolation requirements, or regulatory isolation (payments).

**Expected first extractions (TARGET, not decided):** Messaging (stateful WebSockets),
Search indexer (OpenSearch consumer), Payments (compliance isolation).

## 4. Domain map

| Domain                                                                        | Status      | Owns                        |
| ----------------------------------------------------------------------------- | ----------- | --------------------------- |
| Identity (authn, accounts, sessions, platform roles)                          | **CURRENT** | schema `identity`           |
| Platform: outbox, audit                                                       | **CURRENT** | schemas `platform`, `audit` |
| Profile (professional profile, experience, skills)                            | TARGET      | schema `profile`            |
| Organization (companies, membership, org roles, registration/tax identifiers) | TARGET      | schema `organization`       |
| Network (connections, follows, the business graph)                            | TARGET      |                             |
| Catalog (products, services)                                                  | TARGET      |                             |
| Content (posts, feed)                                                         | TARGET      |                             |
| Messaging                                                                     | TARGET      | separate service likely     |
| Trade (RFQ → quote → negotiation → order)                                     | TARGET      |                             |
| Payments                                                                      | TARGET      | isolated service likely     |
| Trust (verification), Reputation (reviews, scores)                            | TARGET      |                             |
| Search, Recommendation, AI                                                    | TARGET      | derived data only           |
| Notification, Analytics, Administration                                       | TARGET      |                             |

Business graph (Person/Company/Product/Service/Opportunity relationships) will be modelled
across Network, Organization and Catalog with relationship events feeding Search and
Recommendation. **OPEN QUESTION:** whether the graph needs a dedicated graph store or
remains relational + search; decide with real query patterns.

## 5. Events (CURRENT foundation)

- **Transactional outbox** (`platform.outbox_events`): the state change and its event are
  committed atomically. No dual-write problem.
- **Relay worker** claims due rows with `FOR UPDATE SKIP LOCKED` (safe with many workers),
  publishes, marks `published_at`; failures get capped exponential backoff
  (`next_attempt_at`) and are **dead-lettered** after `OUTBOX_MAX_ATTEMPTS`.
- **Delivery is at-least-once.** Consumers deduplicate on event `id`.
- **Ordering:** best-effort per aggregate (ordered by `occurred_at` within a batch); a
  retried event can be overtaken by a later one. Consumers must tolerate this (e.g. compare
  aggregate state/version). **OPEN QUESTION:** strict per-aggregate ordering when moving to
  Kafka (partition by `aggregate_id`, and hold back later events for an aggregate with a
  failing event).
- **Envelope:** `{ id, type, version, aggregateType, aggregateId, occurredAt, payload, metadata{requestId, actorUserId} }`.
- **Naming:** `<domain>.<aggregate>.<past_tense>`; breaking payload changes bump `version`.

### Event catalog (CURRENT)

| Type                                  | Version | Payload                                                               | Emitted when                                    |
| ------------------------------------- | ------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `identity.user.created` (UserCreated) | 1       | `userId, displayName, locale, timezone, countryCode`                  | Registration commits                            |
| `identity.user.profile_updated`       | 1       | `userId, changedFields[], displayName, locale, timezone, countryCode` | `PATCH /v1/me` commits                          |
| `identity.user.email_verified`        | 1       | `userId`                                                              | Email verification (not password reset) commits |

Payloads deliberately exclude email and credentials.

### Email delivery (CURRENT)

Modules render their own email copy (locale-keyed catalog with language → English
fallback) and call `enqueueEmail` inside the triggering transaction. The worker sends from
`platform.email_outbox` through an `EmailTransport` — Amazon SES v2 in production, a log
transport in development (forbidden in production by config). Delivery is at-least-once
with capped exponential backoff and dead-lettering; bodies are purged after sending. One-time
secrets therefore never travel through the event bus.

**TARGET:** Kafka publisher replacing the log publisher; schema registry or checked-in
JSON Schemas per event version; consumer framework with idempotency table and DLQ topics.

## 6. Cross-cutting capabilities

| Capability    | CURRENT                                                                                                                                                                                                                                | TARGET                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Config        | zod-validated env, fail-fast, prod guards                                                                                                                                                                                              | Secrets manager injection                                                |
| Logging       | pino JSON, request IDs, redaction                                                                                                                                                                                                      | Shipping to central store                                                |
| Tracing       | OpenTelemetry traces (HTTP server + PostgreSQL spans, W3C `traceparent` propagation, route-named spans, `trace_id`/`span_id` in every log line, worker batch spans), OTLP/HTTP export; off unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set | ADOT collector sidecar on ECS → AWS X-Ray                                |
| Metrics       | —                                                                                                                                                                                                                                      | OpenTelemetry metrics (RED per route, pool, outbox lag) → CloudWatch     |
| API contract  | OpenAPI 3.1 generated from the zod schemas; served at `/openapi.json`, committed as `docs/openapi.json`; tests prove every route is documented and responses conform                                                                   | Client SDK generation for web/mobile                                     |
| Health        | `/health/live`, `/health/ready` (DB check, drain on SIGTERM)                                                                                                                                                                           | Dependency-aware readiness per component                                 |
| Rate limiting | Per-instance in-memory; DB-backed per-account login throttle                                                                                                                                                                           | Redis-backed distributed limits; edge/WAF limits                         |
| AuthN         | Opaque server-side sessions                                                                                                                                                                                                            | MFA (TOTP/WebAuthn), passkeys, OIDC login, device management             |
| AuthZ         | Code-defined RBAC + resource ownership checks                                                                                                                                                                                          | Organization-scoped roles, ABAC policies                                 |
| Search        | —                                                                                                                                                                                                                                      | OpenSearch fed by events; failure degrades only search                   |
| Cache         | —                                                                                                                                                                                                                                      | Redis (sessions cache, rate limits, hot reads)                           |
| AI            | —                                                                                                                                                                                                                                      | Internal provider-agnostic AI gateway with timeouts/fallbacks            |
| Analytics     | —                                                                                                                                                                                                                                      | ClickHouse (or equivalent) fed by events; never queried on request paths |

## 7. Infrastructure (TARGET)

Global edge (CDN/WAF/DDoS) → global traffic routing → regional infrastructure →
availability zones → Kubernetes → services → PostgreSQL / Redis / OpenSearch / Kafka /
object storage / analytics. Multi-AZ first, multi-region later; cell-based architecture when
scale requires. All via Terraform/OpenTofu.

**DECISION (founder, approved):** AWS, first region **Mumbai `ap-south-1`**. Configuration
defaults to `AWS_REGION=ap-south-1`; transactional email uses Amazon SES in that region.

**CURRENT:** Dockerfile (non-root, one image, three process types), docker-compose for local
development, GitHub Actions CI. **No AWS resources have been created**; the development
sandbox used to build this code is not a server and holds no production data.

**First AWS footprint** — compute and database approved by the founder; the rest is proposed. Nothing is created until the Terraform is reviewed and applied with approval:

| Layer         | Proposal                                                                                              | Alternatives                              |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Accounts      | AWS Organizations: separate `staging` and `production` accounts                                       | single account (not recommended)          |
| Network       | VPC across 3 AZs in ap-south-1, private subnets for compute and data                                  |                                           |
| Compute       | **DECIDED: ECS on Fargate** (API + worker services; migrations as a one-off task before each rollout) | EKS later if/when Kubernetes is justified |
| Database      | **DECIDED: RDS for PostgreSQL 16**, Multi-AZ, encrypted, automated backups + PITR                     | Aurora later if scale requires            |
| Edge          | CloudFront + AWS WAF + Shield Standard; ALB in front of the API                                       |                                           |
| Email         | SES (verified domain, DKIM/SPF/DMARC, configuration set for bounces/complaints)                       |                                           |
| Secrets       | Secrets Manager / SSM Parameter Store; IAM roles for tasks (no static keys)                           |                                           |
| Observability | CloudWatch logs; ADOT collector sidecar receiving OTLP from the app → X-Ray traces                    | managed Grafana                           |
| IaC           | Terraform/OpenTofu with remote state in S3, per-environment workspaces                                |                                           |

## 8. Scale path for the data layer

1. Single primary + PITR backups (launch). 2. Read replicas for read-heavy modules.
2. Partition append-heavy tables by time (`audit.security_events`, `platform.outbox_events`,
   messages). 4. Split modules onto separate databases (schemas already separate).
3. Shard by tenant/region/user where justified (UUIDv7 keys are shard-safe; global
   uniqueness constraints like email need a global lookup — see DATABASE.md).

## 9. Frontend and mobile (TARGET)

Next.js + React + TypeScript web app; React Native mobile. Both consume `/v1` and share
`@ibc/kernel` (kept runtime-neutral: no Node-only imports). Web will hold the session
token server-side (BFF) in an `HttpOnly; Secure; SameSite` cookie rather than exposing it to
browser JavaScript.
