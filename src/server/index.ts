import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from './lib/logger'
import { projectsRouter } from './routes/projects'
import { uploadRouter } from './routes/upload'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', honoLogger())

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Routes
app.route('/api/projects', projectsRouter)
app.route('/api/upload', uploadRouter)

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
