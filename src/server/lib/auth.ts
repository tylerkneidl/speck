import { getAuth } from '@hono/clerk-auth'
import type { Context, MiddlewareHandler } from 'hono'

/**
 * Local-only escape hatch: run the API without Clerk for pure UI testing.
 * Active only when NODE_ENV !== 'production' AND DEV_AUTH_BYPASS=true.
 * Never active in production, regardless of env.
 */
export const AUTH_BYPASS =
  process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true'

const BYPASS_USER_ID = 'dev-user'

// Make the authenticated user id available on the Hono context (typed).
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
  }
}

/**
 * Requires a verified Clerk session. On success, sets `userId` on the context;
 * otherwise returns 401. Assumes clerkMiddleware() has already run for the route
 * (see server/index.ts), except in AUTH_BYPASS mode where Clerk is skipped.
 */
export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    if (AUTH_BYPASS) {
      c.set('userId', BYPASS_USER_ID)
      return next()
    }

    const auth = await getAuth(c)
    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('userId', auth.userId)
    return next()
  }
}

/**
 * Returns the authenticated user id set by requireAuth().
 * Throws if called on a route that isn't behind requireAuth().
 */
export function getUserId(c: Context): string {
  const userId = c.get('userId')
  if (!userId) {
    throw new Error('getUserId() called without requireAuth() middleware')
  }
  return userId
}
