import type { MiddlewareHandler } from 'hono'
import { routePath } from 'hono/route'
import { logger } from './logger'

/**
 * One JSON line per API request: request ID, method, route, status, duration
 * and the opaque Clerk user ID when signed in. Runs after hono/request-id, so
 * the ID matches the x-request-id header the client sees (and can quote back).
 *
 * Successful health checks are skipped: the uptime monitor calls them every
 * minute and they'd drown out real traffic.
 */
export function requestLog(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now()
    await next()
    const status = c.res.status
    if (c.req.path.startsWith('/api/health') && status < 400) return

    const fields = {
      requestId: c.get('requestId'),
      method: c.req.method,
      // The matched pattern (/api/projects/:id), not the raw path, so logs group
      // by route and don't carry resource IDs in the message.
      route: routePath(c, -1),
      status,
      durationMs: Math.round(performance.now() - start),
      userId: c.get('userId'),
    }
    if (status >= 500) logger.error(fields, 'request failed')
    else if (status >= 400) logger.warn(fields, 'request rejected')
    else logger.info(fields, 'request')
  }
}
