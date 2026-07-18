import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { clerkMiddleware } from '@clerk/hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { AUTH_BYPASS, requireAuth } from './lib/auth'
import { logger } from './lib/logger'
import { projectsRouter } from './routes/projects'
import { shareRouter } from './routes/share'
import { uploadRouter } from './routes/upload'
import { webhooksRouter } from './routes/webhooks'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', honoLogger())

// Health check (public)
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

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
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
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

// Serve static files in production
const distPath = join(process.cwd(), 'dist')
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ root: './dist' }))

  // SPA fallback - serve index.html for client-side routes
  app.get('*', (c) => {
    const indexPath = join(distPath, 'index.html')
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf-8')
      return c.html(html)
    }
    return c.notFound()
  })
}

// Error handling
app.onError((err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

// 404 handler for API routes only (in dev mode)
app.notFound((c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: 'Not found' }, 404)
  }
  // In dev mode without dist, return a helpful message
  return c.json({ error: 'Frontend not built. Run npm run build first.' }, 404)
})

const port = Number.parseInt(process.env.PORT || '3001', 10)

logger.info({ port }, 'Starting server')

serve({
  fetch: app.fetch,
  port,
})

export default app
