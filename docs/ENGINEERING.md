# Engineering

## Toolchain

| Tool       | Version                                                                 | Notes                                                |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Node.js    | 22 LTS (`.nvmrc`, `engines >=22.12 <23`)                                |                                                      |
| pnpm       | 10 (`packageManager` field; `corepack enable`)                          | Workspaces                                           |
| TypeScript | 5.9, strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` | ESM / NodeNext                                       |
| PostgreSQL | 16                                                                      | Local via `docker compose up -d` or a native install |

Works on macOS, Windows and Linux: no shell-specific npm scripts, no native addons.
Line endings are normalized to LF (`.gitattributes`, `.editorconfig`).

## Getting started

```sh
corepack enable
pnpm install
docker compose up -d                 # PostgreSQL with `ibc` and `ibc_test` databases
cp .env.example .env
pnpm db:migrate
pnpm dev                             # API on http://localhost:3000
pnpm --filter @ibc/api dev:worker    # outbox relay (optional locally)
```

Without Docker, any PostgreSQL 16 works: create role `ibc` and databases `ibc` and
`ibc_test`, then set `DATABASE_URL` / `TEST_DATABASE_URL`.

## Quality gates (`pnpm check`)

`format:check` (Prettier) → `lint` (ESLint, typescript-eslint strict type-checked, zero
warnings) → `typecheck` → `test` (Vitest; integration tests on real PostgreSQL) → `build`.
CI runs the same, plus dependency audit, secret scanning and a container build.

## Workspace packages and source resolution

Workspace packages export an `@ibc/source` condition pointing to `src/*.ts`. Dev (`tsx
--conditions=@ibc/source`), typecheck (`customConditions`) and tests (Vitest aliases in
`vitest.shared.ts`) use sources directly, so no pre-build is needed. Production builds
(`tsconfig.build.json`) resolve to compiled `dist/`. `pnpm build` builds in dependency order.

## Testing strategy

- **Unit tests** next to code (`*.test.ts`) for pure logic (kernel, password hashing, authz).
- **Integration tests** in `apps/api/test/` drive the real Fastify app via `inject()` against a
  real PostgreSQL. The helper refuses any database whose name does not end in `_test` and
  rebuilds schemas from migrations, so migrations are exercised on every run.
- **Architecture tests** (`test/architecture.test.ts`) enforce module boundaries.
- TARGET: contract tests (OpenAPI), load tests (k6) before launch, Kafka consumer tests.

## Adding a domain module (checklist)

1. Migration creating `CREATE SCHEMA <domain>` + tables; document in `DATABASE.md`.
2. `src/modules/<domain>/` with `index.ts` (public surface), `repository.ts` (only file with
   SQL), `service.ts`, `routes.ts`, `schemas.ts` (zod), `events.ts`.
3. Register schema ownership in `test/architecture.test.ts` (`MODULE_SCHEMAS`).
4. Register the module in `src/app.ts`.
5. Permissions in `platform/authz/authorization.ts`; audit security-relevant actions.
6. Events appended in-transaction; add them to the catalog in `ARCHITECTURE.md`.
7. Tests (unit + integration), `API.md` updated.

## Dependency register

Every runtime dependency must be justified here.

| Package               | Where | Why                                                                                                         |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| `fastify`             | api   | Fast, mature HTTP framework with first-class TypeScript, hooks, encapsulated plugins, built-in pino logging |
| `@fastify/helmet`     | api   | Security headers                                                                                            |
| `@fastify/cors`       | api   | Explicit CORS allow-listing                                                                                 |
| `@fastify/rate-limit` | api   | Rate limiting; supports Redis store when we scale out                                                       |
| `pino`                | api   | Structured JSON logger (same instance family Fastify uses); needed directly by the worker                   |
| `pg`                  | api   | PostgreSQL driver. No ORM: explicit SQL keeps queries reviewable and performance predictable                |
| `zod`                 | api   | Runtime validation for config and every API input; source for future OpenAPI generation                     |

Dev: `typescript`, `typescript-eslint`, `eslint`, `@eslint/js`, `globals`, `prettier`,
`vitest`, `tsx` (dev runner), `@types/node`, `@types/pg`.

Deliberately **not** added yet: ORM, Redis, Kafka client, OpenSearch client, OpenTelemetry SDK,
Next.js/React Native, Turborepo. Each will be added when the feature that needs it is built.

## Decisions log

| #   | Decision                                                                                   | Status                                                                   |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| D1  | pnpm workspace monorepo (`apps/*`, `packages/*`)                                           | Adopted                                                                  |
| D2  | Modular service with schema-per-domain and enforced boundaries (see ARCHITECTURE §3)       | Adopted — **founder review requested**                                   |
| D3  | Fastify + raw SQL (`pg`) + zod; no ORM                                                     | Adopted                                                                  |
| D4  | UUIDv7 application-generated IDs                                                           | Adopted                                                                  |
| D5  | Opaque server-side sessions (not JWT) for first-party clients                              | Adopted — revocable, no key management; OIDC/JWT for third parties later |
| D6  | scrypt for password hashing (built-in, cross-platform); argon2id migration path via rehash | Adopted                                                                  |
| D7  | Transactional outbox + relay worker; Kafka publisher later                                 | Adopted                                                                  |
| D8  | Forward-only, checksummed SQL migrations with an in-house runner (~100 lines)              | Adopted — avoids a dependency; revisit if needs grow                     |

## Open questions for the founder

1. Cloud provider and first region (AWS `ap-south-1` Mumbai is a natural fit for a
   Maharashtra launch; GCP `asia-south1` and Azure Central India are alternatives).
2. Transactional email provider (needed for verification, password reset).
3. Phone/SMS OTP sign-in for the Indian market (provider, cost, and whether phone becomes a
   primary identifier).
4. Security contact and vulnerability disclosure policy.
5. Data residency/retention requirements (e.g. India DPDP Act obligations) — needs legal input;
   no compliance claims are made here.
6. Repository licence (currently `UNLICENSED`/private).
