import { useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useCoordinateStore } from '@/stores/coordinates'
import { cn } from '@/lib/utils'

interface AxisRotationProps {
  className?: string
}

export function AxisRotation({ className }: AxisRotationProps) {
  const { rotation, yAxisUp, setRotation, toggleYAxis } = useCoordinateStore()
  const [rotationInput, setRotationInput] = useState(rotation.toString())

  // Sync input with store when rotation changes externally
  useEffect(() => {
    setRotationInput(rotation.toString())
  }, [rotation])

  const handleRotationInputChange = useCallback(
    (value: string) => {
      setRotationInput(value)
      const num = parseFloat(value)
      if (!isNaN(num) && num >= -180 && num <= 180) {
        setRotation(num)
      }
    },
    [setRotation]
  )

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const value = values[0] ?? 0
      setRotation(value)
      setRotationInput(value.toString())
    },
    [setRotation]
  )

  const handleReset = useCallback(() => {
    setRotation(0)
    setRotationInput('0')
  }, [setRotation])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Axis Settings
        </span>
        {rotation !== 0 && (
          <button
            onClick={handleReset}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-muted-foreground"
          >
            Reset
          </button>
        )}
      </div>

      {/* Rotation preview */}
      <div className="flex items-center justify-center py-2">
        <div className="relative h-24 w-24">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border border-border bg-sunken" />

          {/* Degree markings */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div
              key={deg}
              className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
              style={{
                transform: `rotate(${deg}deg) translateY(-38px)`,
                transformOrigin: '50% 50%',
              }}
            />
          ))}

          {/* Axes */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(-50%, -50%) rotate(${-rotation}deg)` }}
          >
            {/* X-axis */}
            <div className="absolute left-1/2 top-1/2 h-0.5 w-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
            <span className="absolute left-[calc(50%+36px)] top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-red-400">
              X
            </span>

            {/* Y-axis */}
            <div
              className={cn(
                'absolute left-1/2 top-1/2 h-16 w-0.5 -translate-x-1/2 -translate-y-1/2',
                yAxisUp
                  ? 'bg-gradient-to-t from-blue-500/20 via-blue-500 to-blue-500/20'
                  : 'bg-gradient-to-b from-blue-500/20 via-blue-500 to-blue-500/20'
              )}
            />
            <span
              className={cn(
                'absolute left-1/2 -translate-x-1/2 font-mono text-xs font-bold text-blue-400',
                yAxisUp ? 'top-[calc(50%-40px)]' : 'top-[calc(50%+32px)]'
              )}
            >
              Y{yAxisUp ? '+' : '−'}
            </span>

            {/* Center point */}
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground" />
          </div>

          {/* Current angle indicator */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {rotation.toFixed(1)}°
            </span>
          </div>
        </div>
      </div>

      {/* Rotation slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="rotation-input" className="font-mono text-xs text-muted-foreground">
            Rotation
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="rotation-input"
              type="number"
              step="0.5"
              min="-180"
              max="180"
              value={rotationInput}
              onChange={(e) => handleRotationInputChange(e.target.value)}
              className="h-7 w-20 border-input bg-secondary/50 text-right font-mono text-xs tabular-nums placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
            />
            <span className="font-mono text-xs text-muted-foreground">°</span>
          </div>
        </div>
        <Slider
          value={[rotation]}
          onValueChange={handleSliderChange}
          min={-180}
          max={180}
          step={0.5}
          className="py-2"
        />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>−180°</span>
          <span>0°</span>
          <span>+180°</span>
        </div>
      </div>

      {/* Y-axis direction toggle */}
      <div className="flex items-center justify-between rounded-md border border-border bg-sunken p-3">
        <div className="space-y-1">
          <Label htmlFor="y-axis-toggle" className="font-mono text-xs text-muted-foreground">
            Positive Y Direction
          </Label>
          <p className="text-xs text-muted-foreground">
            {yAxisUp ? 'Up (physics convention)' : 'Down (screen convention)'}
          </p>
        </div>
        <Switch
          id="y-axis-toggle"
          checked={yAxisUp}
          onCheckedChange={toggleYAxis}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Tip: Rotate axes to align with inclined planes or tilted surfaces in your video.
      </p>
    </div>
  )
}
