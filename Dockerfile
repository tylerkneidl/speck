# syntax=docker/dockerfile:1

# ---- build: full deps, compile the Next.js app ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* vars are baked into the client at build time. Railway exposes
# service variables to Dockerfile builds as build args. next.config.ts maps the
# legacy VITE_CLERK_PUBLISHABLE_KEY onto NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, so
# either name works; without one the shipped bundle runs with no auth.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime: prod deps only; `next start` serves pages + /api (Hono) ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
# tsx + drizzle-orm are prod deps, so migrations apply (preDeployCommand)
# without the dev-only drizzle-kit / build toolchain. Not using Next's
# standalone output for that reason: migrate.ts needs src/ and node_modules.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY src ./src
COPY drizzle ./drizzle
COPY next.config.ts tsconfig.json tsconfig.node.json drizzle.config.ts ./
# Railway injects PORT; next start honours it (defaults to 3000).
EXPOSE 3000
CMD ["npm", "run", "start"]
