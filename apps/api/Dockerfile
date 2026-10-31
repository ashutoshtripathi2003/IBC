# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/api/Dockerfile -t ibc-api .
# One image serves three process types: API (default), outbox worker, migrations.

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/kernel/package.json packages/kernel/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY packages/kernel packages/kernel
COPY apps/api apps/api
RUN pnpm --filter @ibc/api... run build \
 && pnpm --filter @ibc/api deploy --prod --legacy /out

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# Never run as root.
USER node
EXPOSE 3000
# Orchestrators use /health/live and /health/ready; process types:
#   API:        node --import ./dist/telemetry.js dist/main.js
#   Worker:     node --import ./dist/telemetry.js dist/worker.js
#   Migrations: node dist/migrate.js
CMD ["node", "--import", "./dist/telemetry.js", "dist/main.js"]
