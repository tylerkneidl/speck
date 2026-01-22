/**
 * Auth utilities that gracefully handle missing Clerk provider.
 * When Clerk is not configured, these components render fallback content
 * to allow UI development without authentication.
 */

import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

/**
 * Check if Clerk is available in the current context.
 */
export function useIsClerkAvailable(): boolean {
  try {
    // This will throw if ClerkProvider is not available
    useClerkAuth()
    return true
  } catch {
    return false
  }
}

/**
 * Hook that returns auth state, with fallback for when Clerk isn't available.
 */
export function useAuth() {
  const isClerkAvailable = useIsClerkAvailable()

  if (!isClerkAvailable) {
    // Return mock "signed out" state when Clerk isn't available
    return {
      isSignedIn: false,
      isLoaded: true,
      userId: null,
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkAuth()
}

interface AuthGateProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only when user is signed in.
 * Falls back to nothing (or fallback prop) when signed out or Clerk unavailable.
 */
export function SignedIn({ children, fallback }: AuthGateProps) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null
  if (!isSignedIn) return fallback ?? null

  return <>{children}</>
}

/**
 * Renders children only when user is signed out or Clerk unavailable.
 */
export function SignedOut({ children }: AuthGateProps) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null
  if (isSignedIn) return null

  return <>{children}</>
}
