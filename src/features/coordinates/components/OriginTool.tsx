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
        'flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Origin Point
        </span>
        {hasCustomOrigin && (
          <button
            onClick={() => setOrigin({ x: 0, y: 0 })}
            className="font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            Reset
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs leading-relaxed text-zinc-500">
        Set the coordinate origin (0, 0). This is where your X and Y axes intersect.
      </p>

      {/* Origin placement */}
      <button
        onClick={onStartPlacement}
        className={cn(
          'group relative flex items-center gap-4 rounded-md border p-4 transition-all',
          isPlacing
            ? 'border-amber-500 bg-amber-500/10'
            : hasCustomOrigin
              ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
        )}
      >
        {/* Origin symbol */}
        <div
          className={cn(
            'relative flex h-10 w-10 items-center justify-center',
            isPlacing
              ? 'text-amber-500'
              : hasCustomOrigin
                ? 'text-emerald-500'
                : 'text-zinc-600 group-hover:text-zinc-500'
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
                ? 'text-amber-400'
                : hasCustomOrigin
                  ? 'text-zinc-300'
                  : 'text-zinc-500 group-hover:text-zinc-400'
            )}
          >
            {hasCustomOrigin ? (
              <>
                <span className="text-zinc-500">px:</span> ({origin.x.toFixed(0)},{' '}
                {origin.y.toFixed(0)})
              </>
            ) : (
              'Click to set origin'
            )}
          </span>
          {hasCustomOrigin && (
            <span className="font-mono text-xs text-zinc-500">
              World coordinates: (0, 0)
            </span>
          )}
        </div>

        {/* Status indicator */}
        {isPlacing && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="font-mono text-xs text-amber-400">Click video</span>
          </div>
        )}
      </button>

      {/* Hint */}
      <p className="text-xs text-zinc-600">
        Tip: Place origin at a convenient reference point, like the starting position of your object.
      </p>
    </div>
  )
}
