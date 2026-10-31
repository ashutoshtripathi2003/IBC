# IBC — Indian Business Circle

A global Professional + Business + Commerce Network. _Build for global scale. Launch for local density._

This repository contains the IBC platform. Current state: the engineering foundation and
the Identity domain (accounts, sessions, authorization, audit, event outbox). See
[docs/PRODUCT.md](docs/PRODUCT.md) for what is and is not built.

## Quick start

Requires Node.js 22, pnpm 10 (`corepack enable`) and PostgreSQL 16 (or Docker).

```sh
pnpm install
docker compose up -d        # PostgreSQL (dev + test databases)
cp .env.example .env
pnpm db:migrate
pnpm dev                    # http://localhost:3000/health/ready
pnpm --filter @ibc/web dev  # website on http://localhost:3001
pnpm check                  # format, lint, typecheck, tests, build
# API contract: http://localhost:3000/openapi.json (also docs/openapi.json)
```

## Repository

| Path              | Contents                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | Public website (Next.js): design system, network visualisation, story pages                                                                                                               |
| `apps/api`        | Platform API service, outbox worker, migrations                                                                                                                                           |
| `packages/kernel` | Shared primitives: UUIDv7, Money, globalization                                                                                                                                           |
| `docs/`           | [Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [API](docs/API.md) · [Security](docs/SECURITY.md) · [Engineering](docs/ENGINEERING.md) · [Product](docs/PRODUCT.md) |
| `CLAUDE.md`       | Engineering rules for AI agents and humans                                                                                                                                                |

## Licence

Private repository. No licence has been chosen yet (see open questions in
[docs/ENGINEERING.md](docs/ENGINEERING.md)).
