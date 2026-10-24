'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { CLERK_PUBLISHABLE_KEY, DEV_NO_AUTH, USE_CLERK } from '@/lib/clerk-config'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

// Brand the entire Clerk surface (sign-in/up modal, UserButton menu, account
// portal) with Speck's design system.
//   - variables: only values Clerk passes straight to CSS. colorPrimary must be
//     a concrete color (Clerk parses it to derive shades — it can't parse
//     hsl(var(--…))); flare is theme-invariant so a literal is fine.
//   - elements: Tailwind classes referencing our tokens. These resolve in the
//     DOM, so the surface/text/inputs follow the light/dark toggle automatically.
const clerkAppearance = {
  layout: { logoImageUrl: '/favicon.svg' },
  variables: {
    colorPrimary: '#ff4e22',
    borderRadius: 'var(--radius)',
    fontFamily: '"Hanken Grotesk Variable", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    cardBox: 'border border-border shadow-xl',
    card: 'bg-card',
    headerTitle: 'text-foreground',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButton: 'bg-background text-foreground border-input hover:bg-accent',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
    formFieldLabel: 'text-foreground',
    formFieldInput: 'bg-background text-foreground border-input',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-flare-hi',
    footer: 'bg-card',
    footerActionText: 'text-muted-foreground',
    footerActionLink: 'text-primary hover:text-flare-hi',
    identityPreviewText: 'text-foreground',
    identityPreviewEditButton: 'text-primary',
  },
}

if (!USE_CLERK && typeof window !== 'undefined') {
  console.warn(
    DEV_NO_AUTH
      ? '🔓 Dev auth bypass ON (NEXT_PUBLIC_DEV_NO_AUTH) — running as a signed-in dev user, no Clerk.'
      : '⚠️ Running without Clerk authentication. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env for full functionality.',
  )
}

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (useState so it isn't shared across requests on the server).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      }),
  )

  const app = (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200} skipDelayDuration={400}>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  )

  if (!USE_CLERK) return app
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={clerkAppearance}>
      {app}
    </ClerkProvider>
  )
}
