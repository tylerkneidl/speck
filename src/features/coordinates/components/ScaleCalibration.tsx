import { useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCoordinateStore, type ScaleUnit } from '@/stores/coordinates'
import { cn } from '@/lib/utils'

interface ScaleCalibrationProps {
  className?: string
  onStartPlacement?: (mode: 'point1' | 'point2') => void
  placementMode?: 'point1' | 'point2' | null
}

const UNITS: { value: ScaleUnit; label: string }[] = [
  { value: 'm', label: 'meters' },
  { value: 'cm', label: 'centimeters' },
  { value: 'mm', label: 'millimeters' },
  { value: 'ft', label: 'feet' },
  { value: 'in', label: 'inches' },
]

export function ScaleCalibration({
  className,
  onStartPlacement,
  placementMode,
}: ScaleCalibrationProps) {
  const {
    scalePoint1,
    scalePoint2,
    scaleDistance,
    scaleUnit,
    pixelsPerUnit,
    setScaleDistance,
    setScaleUnit,
  } = useCoordinateStore()

  const [distanceInput, setDistanceInput] = useState(scaleDistance?.toString() ?? '')

  const handleDistanceChange = useCallback(
    (value: string) => {
      setDistanceInput(value)
      const num = parseFloat(value)
      if (!isNaN(num) && num > 0) {
        setScaleDistance(num)
      }
    },
    [setScaleDistance]
  )

  const isCalibrated = pixelsPerUnit !== null

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
          Scale Calibration
        </span>
        {isCalibrated && (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-flare-ink">Calibrated</span>
          </span>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Click two points on an object of known length, then enter the distance between them.
      </p>

      {/* Point placement buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onStartPlacement?.('point1')}
          className={cn(
            'group relative flex flex-col items-center gap-2 rounded-md border p-3 transition-all',
            placementMode === 'point1'
              ? 'border-warning bg-warning/10'
              : scalePoint1
                ? 'border-primary/50 bg-primary/10 hover:border-primary'
                : 'border-input bg-secondary/50 hover:border-ring'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
              placementMode === 'point1'
                ? 'border-warning text-warning'
                : scalePoint1
                  ? 'border-primary text-flare-ink'
                  : 'border-input text-muted-foreground group-hover:border-ring'
            )}
          >
            1
          </div>
          <span
            className={cn(
              'font-mono text-xs transition-colors',
              placementMode === 'point1'
                ? 'text-warning'
                : scalePoint1
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground group-hover:text-muted-foreground'
            )}
          >
            {scalePoint1
              ? `(${scalePoint1.x.toFixed(0)}, ${scalePoint1.y.toFixed(0)})`
              : 'Set Point'}
          </span>
        </button>

        <button
          onClick={() => onStartPlacement?.('point2')}
          className={cn(
            'group relative flex flex-col items-center gap-2 rounded-md border p-3 transition-all',
            placementMode === 'point2'
              ? 'border-warning bg-warning/10'
              : scalePoint2
                ? 'border-primary/50 bg-primary/10 hover:border-primary'
                : 'border-input bg-secondary/50 hover:border-ring'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
              placementMode === 'point2'
                ? 'border-warning text-warning'
                : scalePoint2
                  ? 'border-primary text-flare-ink'
                  : 'border-input text-muted-foreground group-hover:border-ring'
            )}
          >
            2
          </div>
          <span
            className={cn(
              'font-mono text-xs transition-colors',
              placementMode === 'point2'
                ? 'text-warning'
                : scalePoint2
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground group-hover:text-muted-foreground'
            )}
          >
            {scalePoint2
              ? `(${scalePoint2.x.toFixed(0)}, ${scalePoint2.y.toFixed(0)})`
              : 'Set Point'}
          </span>
        </button>
      </div>

      {/* Distance input */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="scale-distance" className="text-xs text-muted-foreground">
            Distance
          </Label>
          <Input
            id="scale-distance"
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={distanceInput}
            onChange={(e) => handleDistanceChange(e.target.value)}
            className="h-9 border-input bg-secondary/50 font-mono text-sm tabular-nums placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
          />
        </div>
        <div className="w-28 space-y-1.5">
          <Label htmlFor="scale-unit" className="text-xs text-muted-foreground">
            Unit
          </Label>
          <Select value={scaleUnit} onValueChange={(v) => setScaleUnit(v as ScaleUnit)}>
            <SelectTrigger
              id="scale-unit"
              className="h-9 border-input bg-secondary/50 text-sm text-foreground focus:ring-ring"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-input bg-secondary">
              {UNITS.map((unit) => (
                <SelectItem
                  key={unit.value}
                  value={unit.value}
                  className="text-sm text-foreground focus:bg-accent focus:text-foreground"
                >
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scale factor display */}
      {pixelsPerUnit !== null && (
        <div className="rounded-md border border-border bg-sunken p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Scale Factor</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {pixelsPerUnit.toFixed(2)} <span className="text-muted-foreground">px/{scaleUnit}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
