FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/staff/package.json apps/staff/
COPY packages/ui-forms/package.json packages/ui-forms/
RUN npm install --workspaces --include-workspace-root \
  && npm install --no-save --no-workspaces --include=optional \
       --cpu=x64 --os=linux --libc=musl sharp@0.34.2

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
ENV PAYLOAD_SECRET=build-placeholder
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
WORKDIR /repo/apps/staff
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/staff/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/staff/.next/static ./apps/staff/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules /repo/node_modules
COPY --from=builder --chown=nextjs:nodejs /repo/package.json /repo/
COPY --from=builder --chown=nextjs:nodejs /repo/apps/staff/src/migrations /repo/apps/staff/src/migrations
COPY --from=builder --chown=nextjs:nodejs /repo/apps/staff/src/migrate.config.ts /repo/apps/staff/src/migrate.config.ts
COPY --from=builder --chown=nextjs:nodejs /repo/apps/staff/package.json /repo/apps/staff/tsconfig.json /repo/apps/staff/
COPY --chown=nextjs:nodejs apps/staff/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
