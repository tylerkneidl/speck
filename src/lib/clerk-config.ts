/**
 * Clerk keys and the dev bypass, shared by the client providers and the
 * Next.js proxy. The publishable key falls back to the pre-Next.js name
 * (VITE_CLERK_PUBLISHABLE_KEY) so existing Railway variables keep working;
 * next.config.ts inlines it at build time.
 */
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

// A real key, not the .env.example placeholder.
const hasValidClerkKey =
  CLERK_PUBLISHABLE_KEY.startsWith('pk_') && CLERK_PUBLISHABLE_KEY !== 'pk_test_xxx'

// Dev-only auth bypass: skip Clerk and run signed-in so gated screens (project
// list, editor) are reachable without logging in. Gated on NODE_ENV so it can
// NEVER be active in a production build, regardless of the env var.
export const DEV_NO_AUTH =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_NO_AUTH === 'true'

export const USE_CLERK = hasValidClerkKey && !DEV_NO_AUTH
