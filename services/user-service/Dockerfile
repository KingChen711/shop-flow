# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy ALL packages needed for build (including typescript-config)
COPY packages/typescript-config ./packages/typescript-config
COPY packages/proto ./packages/proto
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils

# Copy service
COPY services/user-service ./services/user-service

# Install ALL dependencies (needed for building)
RUN pnpm install --frozen-lockfile

# Remove tsbuildinfo files to force fresh builds (incremental builds fail without dist/)
RUN find . -name "tsconfig.tsbuildinfo" -delete

# Build shared packages first (sequential to ensure completion)
WORKDIR /app/packages/shared-types
RUN pnpm build && ls -la dist/

WORKDIR /app/packages/shared-utils
RUN pnpm build && ls -la dist/

# Build the service
WORKDIR /app/services/user-service
RUN rm -f tsconfig.tsbuildinfo && pnpm build

# ================================
# Stage 2: Production
# ================================
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/proto ./packages/proto
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY services/user-service/package.json ./services/user-service/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/services/user-service

# Expose gRPC port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('net').connect(50051, 'localhost').on('error', () => process.exit(1)).end()"

CMD ["node", "dist/main.js"]
