# ==========================================
# Stage 1: Build & TypeScript Compilation
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy server source code
COPY src ./src

# Build TypeScript to dist/
RUN npm run build

# Prune dev dependencies for lean runtime image
RUN npm prune --production

# ==========================================
# Stage 2: Production Minimal Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

# Create non-root system user for security compliance
USER node

# Copy production artifacts from builder
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Create local upload directory with permissions
USER root
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health/ready || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
