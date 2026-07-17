# syntax=docker/dockerfile:1

# ---- build: full deps, compile the client bundle ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* vars are baked into the client at build time. Railway exposes service
# variables to Dockerfile builds as build args — declare the one the client needs
# so the shipped bundle carries the real Clerk publishable key (not empty →
# "development mode" / no auth). Only this one is required in prod; VITE_DEV_NO_AUTH
# is dev-only (gated on import.meta.env.DEV).
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

# ---- runtime: prod deps only; Hono serves the API + built SPA ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# tsx + drizzle-orm are prod deps, so the server runs and migrations apply without
# the dev-only drizzle-kit / build toolchain.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY src ./src
COPY drizzle ./drizzle
COPY tsconfig.json tsconfig.node.json drizzle.config.ts ./
EXPOSE 3001
CMD ["npm", "run", "start"]
