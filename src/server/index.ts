import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
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

// Error handling
app.onError((err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

const port = Number.parseInt(process.env.PORT || '3001', 10)

logger.info({ port }, 'Starting server')

serve({
  fetch: app.fetch,
  port,
})

export default app
