import { useCallback } from 'react'
import { useAuth } from './auth'

/**
 * Returns a fetch() wrapper that attaches the Clerk session token (when
 * available) as a Bearer header. Use for every call to our own /api/* routes so
 * the server can authenticate the request. When Clerk isn't configured (local
 * UI-only dev), it falls back to a plain fetch with no token.
 */
export function useApiClient() {
  const auth = useAuth()
  // getToken only exists on the real Clerk auth object, not the no-Clerk fallback.
  const getToken = 'getToken' in auth ? auth.getToken : undefined

  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers)
      if (getToken) {
        const token = await getToken()
        if (token) headers.set('Authorization', `Bearer ${token}`)
      }
      return fetch(path, { ...init, headers })
    },
    [getToken],
  )
}
