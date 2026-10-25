'use client'

import { reportError } from '@/lib/report-error'
import { useEffect } from 'react'

// Last resort: the root layout itself crashed, so there's no stylesheet,
// theme or providers. It replaces the whole document and keeps to inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, 'global')
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 16,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#f7f8fa',
          color: '#111827',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          The error has been reported. Reload the page to try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#ff4e22',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
