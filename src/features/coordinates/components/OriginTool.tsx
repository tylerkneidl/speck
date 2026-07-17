import { useCoordinateStore } from '@/stores/coordinates'
import { cn } from '@/lib/utils'

interface OriginToolProps {
  className?: string
  onStartPlacement?: () => void
  isPlacing?: boolean
}

export function OriginTool({ className, onStartPlacement, isPlacing }: OriginToolProps) {
  const { origin, setOrigin } = useCoordinateStore()

  const hasCustomOrigin = origin.x !== 0 || origin.y !== 0

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Origin Point
        </span>
        {hasCustomOrigin && (
          <button
            onClick={() => setOrigin({ x: 0, y: 0 })}
            className="text-xs text-muted-foreground transition-colors hover:text-muted-foreground"
          >
            Reset
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Set the coordinate origin (0, 0). This is where your X and Y axes intersect.
      </p>

      {/* Origin placement */}
      <button
        onClick={onStartPlacement}
        className={cn(
          'group relative flex items-center gap-4 rounded-md border p-4 transition-all',
          isPlacing
            ? 'border-warning bg-warning/10'
            : hasCustomOrigin
              ? 'border-primary/50 bg-primary/10 hover:border-primary'
              : 'border-input bg-secondary/50 hover:border-ring'
        )}
      >
        {/* Origin symbol */}
        <div
          className={cn(
            'relative flex h-10 w-10 items-center justify-center',
            isPlacing
              ? 'text-warning'
              : hasCustomOrigin
                ? 'text-flare-ink'
                : 'text-muted-foreground group-hover:text-foreground'
          )}
        >
          {/* Crosshair */}
          <div className="absolute h-full w-0.5 bg-current" />
          <div className="absolute h-0.5 w-full bg-current" />
          {/* Center dot */}
          <div className="relative h-2 w-2 rounded-full bg-current" />
        </div>

        {/* Coordinates */}
        <div className="flex flex-col items-start gap-0.5">
          <span
            className={cn(
              'font-mono text-sm transition-colors',
              isPlacing
                ? 'text-warning'
                : hasCustomOrigin
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-muted-foreground'
            )}
          >
            {hasCustomOrigin ? (
              <>
                <span className="text-muted-foreground">px:</span> ({origin.x.toFixed(0)},{' '}
                {origin.y.toFixed(0)})
              </>
            ) : (
              'Click to set origin'
            )}
          </span>
          {hasCustomOrigin && (
            <span className="font-mono text-xs text-muted-foreground">
              World coordinates: (0, 0)
            </span>
          )}
        </div>

        {/* Status indicator */}
        {isPlacing && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
            <span className="text-xs text-warning">Click video</span>
          </div>
        )}
      </button>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Tip: Place origin at a convenient reference point, like the starting position of your object.
      </p>
    </div>
  )
}
