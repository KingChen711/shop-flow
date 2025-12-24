# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/typescript-config ./packages/typescript-config
COPY packages/proto ./packages/proto
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/order-service ./services/order-service

RUN pnpm install --frozen-lockfile

# Remove tsbuildinfo files to force fresh builds
RUN find . -name "tsconfig.tsbuildinfo" -delete

# Build shared packages first
WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/packages/shared-utils
RUN pnpm build

# Build the service
WORKDIR /app/services/order-service
RUN pnpm build

# ================================
# Stage 2: Production
# ================================
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/proto ./packages/proto
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/order-service/package.json ./services/order-service/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/services/order-service/dist ./services/order-service/dist

RUN chown -R nestjs:nodejs /app
USER nestjs
WORKDIR /app/services/order-service

EXPOSE 50053

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('net').connect(50053, 'localhost').on('error', () => process.exit(1)).end()"

CMD ["node", "dist/main.js"]
