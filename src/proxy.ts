import { CLERK_PUBLISHABLE_KEY, USE_CLERK } from '@/lib/clerk-config'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server'

// Clerk's session handling for Next.js (needed by @clerk/nextjs components).
// It protects nothing on its own: pages gate themselves, and /api routes keep
// verifying sessions inside Hono (src/server/app.ts). The secret key is read
// from CLERK_SECRET_KEY by Clerk itself: passing it here as an option makes
// Clerk require CLERK_ENCRYPTION_KEY and 500 every request without one.
const clerk = clerkMiddleware({
  publishableKey: CLERK_PUBLISHABLE_KEY,
})

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!USE_CLERK) return NextResponse.next()
  return clerk(request, event)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
