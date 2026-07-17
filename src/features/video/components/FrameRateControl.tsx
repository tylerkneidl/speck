import { Info } from 'lucide-react'
import { useVideoStore } from '@/stores/video'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const COMMON_RATES = [24, 30, 60, 120, 240]

export function FrameRateControl() {
  const metadata = useVideoStore((s) => s.metadata)
  const setFrameRate = useVideoStore((s) => s.setFrameRate)

  if (!metadata) return null
  const fps = Math.round(metadata.frameRate)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Frame Rate</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground transition-colors hover:text-foreground">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Every velocity and acceleration value depends on the frame rate. It's auto-detected from
            your video — if you know your camera's true fps (e.g. 30, 60, or 240 for slow-motion),
            set it here so the physics comes out right.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={1000}
          step={1}
          value={fps}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (v > 0) setFrameRate(v)
          }}
          className="w-20 rounded-md border border-input bg-secondary/50 px-2 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <span className="font-mono text-sm text-muted-foreground">fps</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {metadata.totalFrames} frames · {metadata.duration.toFixed(1)}s
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {COMMON_RATES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFrameRate(f)}
            className={cn(
              'rounded px-2 py-0.5 font-mono text-[11px] transition-colors',
              fps === f
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
