import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from './components/ui/tooltip'
import { routeTree } from './routeTree.gen'
import '@fontsource-variable/archivo'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if we have a valid Clerk key (not a placeholder)
const hasValidClerkKey =
  CLERK_PUBLISHABLE_KEY &&
  CLERK_PUBLISHABLE_KEY !== 'pk_test_xxx' &&
  CLERK_PUBLISHABLE_KEY.startsWith('pk_')

const rootElement = document.getElementById('root')!

// Dev-only auth bypass: skip Clerk and run signed-in so gated screens (project
// list, editor) are reachable without logging in. Gated on import.meta.env.DEV
// so it can NEVER be active in a production build, regardless of the env var.
const devNoAuth = import.meta.env.DEV && import.meta.env.VITE_DEV_NO_AUTH === 'true'
const useClerk = hasValidClerkKey && !devNoAuth

// Brand the entire Clerk surface (sign-in/up modal, UserButton menu, account
// portal) with Speck's design tokens. Values are hsl(var(--…)) so the dialog
// tracks the light/dark toggle automatically — Clerk renders in our DOM, where
// the CSS variables resolve.
const clerkAppearance = {
  layout: { logoImageUrl: '/favicon.svg' },
  variables: {
    colorPrimary: 'hsl(var(--primary))',
    colorBackground: 'hsl(var(--card))',
    colorText: 'hsl(var(--foreground))',
    colorTextSecondary: 'hsl(var(--muted-foreground))',
    colorInputBackground: 'hsl(var(--background))',
    colorInputText: 'hsl(var(--foreground))',
    colorDanger: 'hsl(var(--destructive))',
    borderRadius: 'var(--radius)',
    fontFamily: '"Hanken Grotesk Variable", ui-sans-serif, system-ui, sans-serif',
  },
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200} skipDelayDuration={400}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

if (useClerk) {
  // Clerk authentication (production, and dev unless bypass is on)
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={clerkAppearance}>
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
} else {
  console.warn(
    devNoAuth
      ? '🔓 Dev auth bypass ON (VITE_DEV_NO_AUTH) — running as a signed-in dev user, no Clerk.'
      : '⚠️ Running without Clerk authentication. Set VITE_CLERK_PUBLISHABLE_KEY in .env for full functionality.',
  )
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
