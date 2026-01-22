import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

if (hasValidClerkKey) {
  // Production mode with Clerk authentication
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </StrictMode>
  )
} else {
  // Development mode without Clerk (for UI testing)
  console.warn(
    '⚠️ Running without Clerk authentication. Set VITE_CLERK_PUBLISHABLE_KEY in .env for full functionality.'
  )
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
