'use client'

import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/report-error'
import { useEffect } from 'react'

// Catches a crash in any page below the root layout. The layout (theme,
// providers) still renders, so this can use the normal design tokens.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, 'route')
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-semibold text-2xl text-foreground">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        The error has been reported. Your saved work is safe. Try again, or reload the page.
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-sm">
          Error ID <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
