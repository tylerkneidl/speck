import { Hono } from 'hono'
import { z } from 'zod'
import { logger } from '../lib/logger'

// What the error boundaries send (src/lib/report-error.ts). Fields are capped
// so a runaway client can't write megabytes into the logs.
const clientErrorSchema = z.object({
  message: z.string().max(1000),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(200).optional(),
  // Path only, no query string: share tokens and lab settings live there.
  path: z.string().max(500).optional(),
  boundary: z.enum(['route', 'global']),
})

export const clientLogRouter = new Hono()

// Public: an error can happen before sign-in. Nothing is returned to the
// caller, so the endpoint can't be used to read anything back.
clientLogRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = clientErrorSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid report' }, 400)

  logger.error(
    { client: parsed.data, requestId: c.get('requestId'), userAgent: c.req.header('user-agent') },
    'Client error',
  )
  return c.body(null, 204)
})
