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
        'flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Scale Calibration
        </span>
        {isCalibrated && (
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">Calibrated</span>
          </span>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs leading-relaxed text-zinc-500">
        Click two points on an object of known length, then enter the distance between them.
      </p>

      {/* Point placement buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onStartPlacement?.('point1')}
          className={cn(
            'group relative flex flex-col items-center gap-2 rounded-md border p-3 transition-all',
            placementMode === 'point1'
              ? 'border-amber-500 bg-amber-500/10'
              : scalePoint1
                ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors',
              placementMode === 'point1'
                ? 'border-amber-500 text-amber-400'
                : scalePoint1
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-zinc-600 text-zinc-500 group-hover:border-zinc-500'
            )}
          >
            1
          </div>
          <span
            className={cn(
              'font-mono text-xs transition-colors',
              placementMode === 'point1'
                ? 'text-amber-400'
                : scalePoint1
                  ? 'text-zinc-400'
                  : 'text-zinc-500 group-hover:text-zinc-400'
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
              ? 'border-amber-500 bg-amber-500/10'
              : scalePoint2
                ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors',
              placementMode === 'point2'
                ? 'border-amber-500 text-amber-400'
                : scalePoint2
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-zinc-600 text-zinc-500 group-hover:border-zinc-500'
            )}
          >
            2
          </div>
          <span
            className={cn(
              'font-mono text-xs transition-colors',
              placementMode === 'point2'
                ? 'text-amber-400'
                : scalePoint2
                  ? 'text-zinc-400'
                  : 'text-zinc-500 group-hover:text-zinc-400'
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
          <Label htmlFor="scale-distance" className="font-mono text-xs text-zinc-500">
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
            className="h-9 border-zinc-700 bg-zinc-800/50 font-mono text-sm tabular-nums placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-zinc-600"
          />
        </div>
        <div className="w-28 space-y-1.5">
          <Label htmlFor="scale-unit" className="font-mono text-xs text-zinc-500">
            Unit
          </Label>
          <Select value={scaleUnit} onValueChange={(v) => setScaleUnit(v as ScaleUnit)}>
            <SelectTrigger
              id="scale-unit"
              className="h-9 border-zinc-700 bg-zinc-800/50 font-mono text-sm focus:ring-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-800">
              {UNITS.map((unit) => (
                <SelectItem
                  key={unit.value}
                  value={unit.value}
                  className="font-mono text-sm focus:bg-zinc-700"
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
        <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs text-zinc-500">Scale Factor</span>
            <span className="font-mono text-sm tabular-nums text-zinc-300">
              {pixelsPerUnit.toFixed(2)} <span className="text-zinc-500">px/{scaleUnit}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
