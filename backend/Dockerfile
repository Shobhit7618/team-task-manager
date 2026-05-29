# ─── STAGE 1: BUILD & DEPENDENCY INSTALLATION ───────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including development packages for Prisma engines
RUN npm ci

# Generate the clean production Prisma Client engine artifacts
RUN npx prisma generate

# ─── STAGE 2: LEAN RUNTIME ENVIRONMENT ──────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Set production execution flags
ENV NODE_ENV=production

# Copy built dependency trees and engines from Stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy source code directories safely
COPY src ./src

# Expose the application network gateway channel port
EXPOSE 5000

# Execute server initialization process
CMD ["node", "src/app.js"]