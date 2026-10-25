/**
 * Sends a crash caught by an error boundary to /api/log, where it lands in the
 * server logs next to the request logs. Best-effort: a failed report must never
 * throw from inside the boundary that is already handling an error.
 */
export function reportError(error: Error & { digest?: string }, boundary: 'route' | 'global') {
  try {
    const body = JSON.stringify({
      message: String(error.message).slice(0, 1000),
      stack: error.stack?.slice(0, 8000),
      digest: error.digest,
      path: window.location.pathname,
      boundary,
    })
    // keepalive lets the report finish even if the user reloads right away.
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Reporting is best-effort.
  }
}
