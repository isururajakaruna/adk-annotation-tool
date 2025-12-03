# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy .env.example as template (user should mount their own .env)
COPY --from=builder /app/.env.example ./.env.example

# Create directories with proper permissions
RUN mkdir -p conversations_saved logs
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port (default 3001, can be overridden)
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Start the standalone server
# Environment variables from --env-file will be available here
CMD ["node", "server.js"]

