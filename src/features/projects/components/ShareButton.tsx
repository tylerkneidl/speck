import { Button } from '@/components/ui/button'
import { useApiClient } from '@/lib/api'
import { Check, Share2 } from 'lucide-react'
import { useCallback, useState } from 'react'

type State = 'idle' | 'working' | 'copied' | 'error'

/**
 * Mints (or re-uses) this project's share link and copies it. The endpoint is
 * idempotent, so clicking again hands back the same URL rather than
 * invalidating links already sent.
 */
export function ShareButton({ projectId }: { projectId: string }) {
  const api = useApiClient()
  const [state, setState] = useState<State>('idle')
  const [url, setUrl] = useState<string | null>(null)

  const share = useCallback(async () => {
    setState('working')
    try {
      const res = await api(`/api/projects/${projectId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create share link')
      const { shareToken } = (await res.json()) as { shareToken: string }
      const link = `${window.location.origin}/share/${shareToken}`
      setUrl(link)
      // Clipboard can reject (permissions / insecure context) — the link is
      // still shown below, so a failure to copy isn't a failure to share.
      try {
        await navigator.clipboard.writeText(link)
        setState('copied')
      } catch {
        setState('idle')
      }
    } catch {
      setState('error')
    }
  }, [api, projectId])

  return (
    <div className="flex items-center gap-2">
      {url && (
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="hidden w-56 rounded border border-input bg-secondary/60 px-2 py-1 font-mono text-[11px] text-foreground lg:block"
          aria-label="Share link"
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={share}
        disabled={state === 'working'}
        title="Create a public view-only link"
        className="gap-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {state === 'copied' ? (
          <>
            <Check className="h-4 w-4 text-plasma" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            {state === 'error' ? 'Retry' : 'Share'}
          </>
        )}
      </Button>
    </div>
  )
}
