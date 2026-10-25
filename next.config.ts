import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    // Accept the pre-Next.js variable name so Railway's existing setting keeps working.
    // `||`, not `??`: the Dockerfile declares these as ARGs defaulting to "", and an
    // empty string must still fall through to the VITE_ name.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_DEV_NO_AUTH:
      process.env.NEXT_PUBLIC_DEV_NO_AUTH || process.env.VITE_DEV_NO_AUTH || '',
  },
  // Server-only packages that must load from node_modules rather than be
  // bundled: pino spawns pino-pretty in a worker thread by module name.
  serverExternalPackages: ['pino', 'pino-pretty'],
}

export default nextConfig
