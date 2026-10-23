import { angleAt } from '@/lib/geometry'
import { cn } from '@/lib/utils'
import { useMeasureStore } from '@/stores/measure'

interface AngleToolProps {
  className?: string
  onStartPlacement?: () => void
  isPlacing?: boolean
}

const STEPS = ['a point on one side', 'the corner', 'a point on the other side']

/** Protractor: measure a ramp incline, launch angle, or swing amplitude straight off the frame. */
export function AngleTool({ className, onStartPlacement, isPlacing }: AngleToolProps) {
  const { anglePoints, clearAngle } = useMeasureStore()
  const [a, vertex, b] = anglePoints
  const angle = a && vertex && b ? angleAt(a, vertex, b) : null
  const nextStep = STEPS[anglePoints.length % 3]

  return (
    <div
      className={cn('flex flex-col gap-4 rounded-lg border border-border bg-card p-4', className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Measure Angle
        </span>
        {anglePoints.length > 0 && (
          <button
            type="button"
            onClick={clearAngle}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Measure an incline, launch angle, or swing amplitude. Click a point on one side, the corner,
        then a point on the other side.
      </p>

      <button
        type="button"
        onClick={onStartPlacement}
        className={cn(
          'group flex items-center gap-4 rounded-md border p-4 text-left transition-all',
          isPlacing
            ? 'border-warning bg-warning/10'
            : angle !== null
              ? 'border-primary/50 bg-primary/10 hover:border-primary'
              : 'border-input bg-secondary/50 hover:border-ring',
        )}
      >
        <svg
          viewBox="0 0 40 40"
          className={cn(
            'h-10 w-10 shrink-0',
            isPlacing
              ? 'text-warning'
              : angle !== null
                ? 'text-flare-ink'
                : 'text-muted-foreground',
          )}
          aria-hidden="true"
        >
          <path d="M4 34 H36 M4 34 L30 10" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path
            d="M18 34 A14 14 0 0 0 14.5 24.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <div className="flex flex-col gap-0.5">
          {angle !== null && !isPlacing ? (
            <>
              <span className="font-mono text-2xl font-semibold text-foreground">
                {angle.toFixed(1)}°
              </span>
              <span className="text-xs text-muted-foreground">Click to measure another</span>
            </>
          ) : (
            <span className={cn('text-sm', isPlacing ? 'text-warning' : 'text-muted-foreground')}>
              {isPlacing ? `Click ${nextStep}` : 'Click to start measuring'}
            </span>
          )}
        </div>
      </button>

      <p className="text-xs text-muted-foreground">
        Tip: for a true angle, the camera should face the motion square-on.
      </p>
    </div>
  )
}
