import { createClerkClient } from '@clerk/backend'

/** Same publishable-key fallback the request middleware uses (VITE_ or plain). */
function makeClient() {
  return createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
  })
}

let client: ReturnType<typeof createClerkClient> | null = null

/**
 * Best-effort display name for a Clerk user id — first+last, else username, else
 * null. Created lazily and wrapped in try/catch so it degrades gracefully (dev
 * without Clerk, a bypass user id, or a Backend API hiccup all → null). Never
 * exposes the email or the raw id.
 */
export async function getOwnerDisplayName(userId: string): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY) return null
  try {
    client ??= makeClient()
    const u = await client.users.getUser(userId)
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || null
  } catch {
    return null
  }
}
