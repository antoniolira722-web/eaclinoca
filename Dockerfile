# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (including devDependencies required for Vite & esbuild)
RUN npm ci

# Copy project files
COPY . .

# Build Vite client assets and bundled Express server
RUN npm run build

# Production Runtime Stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Prepare directory for JSON fallback storage
RUN mkdir -p /app/.data && chown -R node:node /app

USER node

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
