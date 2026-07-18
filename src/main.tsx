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
