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
COPY packages/shared-utils ./packages/shared-utils

# Copy service
COPY services/inventory-service ./services/inventory-service

# Install ALL dependencies (needed for building)
RUN pnpm install --frozen-lockfile && \
    find . -name "tsconfig.tsbuildinfo" -delete

WORKDIR /app/packages/shared-utils
RUN pnpm build

# Build the service
WORKDIR /app/services/inventory-service
RUN pnpm build

# Deploy: create standalone production package (no symlinks, flat node_modules)
WORKDIR /app
RUN pnpm --filter @shopflow/inventory-service deploy --prod /deploy

# Copy built dist files to deploy folder
RUN mkdir -p /deploy/node_modules/@shopflow/shared-utils && \
    mkdir -p /deploy/node_modules/@shopflow/proto && \
    cp -r /app/services/inventory-service/dist /deploy/dist && \
    cp -r /app/packages/shared-utils/dist /deploy/node_modules/@shopflow/shared-utils/dist && \
    cp -r /app/packages/proto /deploy/node_modules/@shopflow/proto

# Cleanup unnecessary files in deploy folder (now flat node_modules, no symlinks)
RUN find /deploy -type f \( \
    -name "*.map" \
    -o -name "*.d.ts" \
    -o -name "*.ts" \
    -o -name "*.tsx" \
    -o -name "*.md" \
    -o -name "*.test.js" \
    -o -name "*.spec.js" \
    -o -name "CHANGELOG*" \
    -o -name "LICENSE*" \
    -o -name "README*" \
    -o -name "*.tsbuildinfo" \
    \) -delete 2>/dev/null || true && \
    find /deploy -type d \( \
    -name "test" \
    -o -name "tests" \
    -o -name "__tests__" \
    -o -name "__mocks__" \
    -o -name "docs" \
    -o -name "example" \
    -o -name "examples" \
    \) -exec rm -rf {} + 2>/dev/null || true && \
    find /deploy -type d -empty -delete 2>/dev/null || true

# ================================
# Stage 2: Production (minimal)
# ================================
FROM node:20-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy only the deployed package (already contains node_modules and dist)
COPY --from=builder /deploy ./

# Copy proto files to the path expected by the code (../../../packages/proto from dist/)
COPY --from=builder /app/packages/proto /packages/proto

# Set ownership
RUN chown -R nestjs:nodejs /app /packages

USER nestjs

# Expose gRPC port
EXPOSE 50054

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('net').connect(50054, 'localhost').on('error', () => process.exit(1)).end()"

CMD ["node", "dist/main.js"]
