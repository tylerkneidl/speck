import { clerkMiddleware } from '@clerk/hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { AUTH_BYPASS, requireAuth } from './lib/auth'
import { logger } from './lib/logger'
import { requestLog } from './lib/request-log'
import { clientLogRouter } from './routes/client-log'
import { healthRouter } from './routes/health'
import { projectsRouter } from './routes/projects'
import { shareRouter } from './routes/share'
import { uploadRouter } from './routes/upload'
import { webhooksRouter } from './routes/webhooks'

/**
 * The API. Mounted inside Next.js by the catch-all route handler at
 * src/app/api/[[...route]]/route.ts, which hands every /api/* request to
 * app.fetch — routes keep their full /api/... paths. Next.js serves the pages.
 */
const app = new Hono()

// Middleware
app.use('*', cors({ origin: '*', exposeHeaders: ['X-Request-Id'] }))
// Reuses an incoming X-Request-Id (so one ID can follow a request from the
// browser) and echoes it on the response.
app.use('*', requestId())
app.use('*', requestLog())

// Health checks (public): /api/health for Railway, /api/health/deep for uptime.
app.route('/api/health', healthRouter)

// Public — error boundaries report crashes here (src/lib/report-error.ts).
app.route('/api/log', clientLogRouter)

// Authentication on protected API routes.
// clerkMiddleware() verifies the session token; requireAuth() enforces it and sets userId.
if (!AUTH_BYPASS) {
  // Pass the keys explicitly so the server reuses the SAME publishable key the
  // client bundle is built with (VITE_CLERK_PUBLISHABLE_KEY). Left to itself,
  // @clerk/hono only reads a separate, non-VITE CLERK_PUBLISHABLE_KEY —
  // easy to forget when VITE_CLERK_PUBLISHABLE_KEY is already set, and its
  // absence 500s every authed request with "Missing Clerk Publishable key".
  const clerk = clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.VITE_CLERK_PUBLISHABLE_KEY,
  })
  app.use('/api/projects/*', clerk)
  app.use('/api/upload/*', clerk)
} else {
  logger.warn('DEV_AUTH_BYPASS enabled — API authentication is disabled (never use in production)')
}
app.use('/api/projects/*', requireAuth())
app.use('/api/upload/*', requireAuth())

// Routes
app.route('/api/projects', projectsRouter)
app.route('/api/upload', uploadRouter)

// Public — deliberately mounted outside the Clerk middleware above, so a share
// link works for a signed-out visitor. Access is gated on the project's
// isPublic flag + an unguessable token inside the router itself.
app.route('/api/share', shareRouter)

// Public — Clerk calls this with no session; authenticity is the Svix signature
// verified inside the router (CLERK_WEBHOOK_SIGNING_SECRET). Never put it behind
// clerkMiddleware/requireAuth.
app.route('/api/webhooks', webhooksRouter)

// Error handling
app.onError((err, c) => {
  const id = c.get('requestId')
  logger.error({ err, requestId: id, path: c.req.path, method: c.req.method }, 'Unhandled error')
  // The ID lets a user's bug report be matched to this log line.
  return c.json({ error: 'Internal server error', requestId: id }, 500)
})

// Next.js only forwards /api/* here (src/app/api/[[...route]]/route.ts).
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
