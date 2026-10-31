# CLAUDE.md — IBC engineering rules for AI agents

This file is loaded automatically by Claude Code. It is the permanent contract for any AI
agent (or human) changing this repository. Read it fully before making changes.

## What this is

**IBC — Indian Business Circle**: a global Professional + Business + Commerce Network
(people, companies, products, services, RFQs, quotes, orders, payments, trust, reputation).
This is a real production product, not a demo or disposable MVP.

- Public identity: **IBC — Indian Business Circle**.
- Internal codename: **PROJECT VIJAY** — internal only. Never use it in public-facing
  product copy, API responses, UI, package names visible to users, or marketing.
- Never claim patents, trademarks, registrations, licenses, certifications or legal
  protections unless they are documented in this repository.

Principle: **Build for global scale. Launch for local density.**
Launch path: Maharashtra → India → international → global. Global-grade architecture,
right-sized initial capacity.

## Where things are

| Path                     | What                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `apps/api`               | Platform API service (Fastify, TypeScript) + outbox worker + migrator        |
| `apps/api/migrations`    | Forward-only SQL migrations (the only way to change the schema)              |
| `apps/api/src/platform`  | Domain-agnostic capabilities: config, db, http, events, audit, authz, health |
| `apps/api/src/modules/*` | Domain modules (currently: `identity`)                                       |
| `packages/kernel`        | Runtime-neutral shared primitives: UUIDv7, Money, globalization              |
| `docs/`                  | PRODUCT, ARCHITECTURE, DATABASE, API, SECURITY, ENGINEERING                  |

## Commands (run from repo root)

```sh
pnpm install            # install
pnpm dev                # run API from sources (needs DATABASE_URL, see .env.example)
pnpm db:migrate         # apply migrations
pnpm check              # format:check + lint + typecheck + test + build — run before declaring done
```

Integration tests need PostgreSQL and a database whose name ends in `_test`
(`TEST_DATABASE_URL`, default `postgres://ibc:ibc_dev_password@localhost:5432/ibc_test`).
`docker compose up -d` provides both databases locally.

## Mandatory rules

1. Never modify production infrastructure without explicit human approval.
2. Never change the database schema without a new migration file. Never edit a migration
   that may have been applied anywhere; the migrator rejects modified migrations.
3. Never commit, log or expose secrets, credentials, tokens or production passwords.
4. Never bypass authentication or trust client-side authorization.
5. Never disable or weaken security checks, tests, lint rules or type checks to get green.
6. Every meaningful feature ships with tests. Integration tests hit real PostgreSQL.
7. Every API input is validated with a zod schema via `parseInput` (strict objects — unknown
   fields are rejected).
8. Every database change is documented in `docs/DATABASE.md`.
9. No new dependency without a written justification (add it to `docs/ENGINEERING.md`).
10. No new deployable service without a documented reason (see ARCHITECTURE "When to split").
11. Do not duplicate business logic; put shared primitives in `packages/kernel`.
12. No cross-domain database access. A module reads/writes only its own Postgres schema;
    cross-module calls go through the other module's `index.ts`. `test/architecture.test.ts`
    enforces this.
13. Preserve public API compatibility (`/v1`) unless a breaking change is explicitly approved.
14. Never invent product requirements; never silently change business behaviour.
15. Never silently make major architectural changes, destructive migrations, or delete major
    functionality — stop and ask.
16. Never claim something is production-ready without evidence (tests, load tests, review).
17. Before declaring completion: tests, typecheck, lint, build (`pnpm check`). Security
    review for security-sensitive changes.
18. Keep documentation synchronized with the implementation, in the same change.
19. If requirements conflict, stop and ask.

## Decisions an agent must NOT make alone

Major product direction · major architecture changes · legal/compliance claims ·
destructive migrations · breaking public APIs · production deployment · security exceptions ·
major infrastructure spending. When one is needed: stop, explain the decision and options.

## Design rules

- **Global-first data model.** Never hard-code INR, Indian phone formats, GST/PAN/CIN,
  Indian address shapes or tax systems. Use `Money` (integer minor units + ISO 4217),
  ISO 3166-1 country codes, IANA timezones, BCP 47 locales, generic
  registration-system/tax-identifier concepts.
- **Identifiers:** UUIDv7 (`uuidv7()` from `@ibc/kernel`), generated in the application.
- **Money:** never floating point. `amount_minor bigint` + `currency char(3)` in SQL.
- **Events:** state changes that other domains care about append a versioned event to the
  outbox (`appendEvent`) **in the same transaction**. Event payloads exclude secrets and
  contact PII. Consumers must be idempotent.
- **PostgreSQL is the source of truth.** Search indexes, caches, analytics and AI outputs
  are derived and must be rebuildable; their failure must not take down core flows.
- **Errors:** throw `AppError`/`Errors.*`; clients receive RFC 9457 problem+json with a stable
  `code`. Never leak internals in 5xx responses.
- **Security audit:** authentication/authorization-relevant actions call
  `recordSecurityEvent`. Never put secrets in audit details.
- **Cross-platform:** code and scripts must work on macOS, Windows and Linux (no bash-only
  npm scripts, no OS-specific native deps without justification).

## Git

Feature branches, small logical commits, descriptive messages. Never force-push shared
history without approval. Never commit `.env` files.
