import { Tooltip as InfoTip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTableData } from '@/features/data-table/hooks/useTableData'
import {
  FIT_MODELS,
  type Fit,
  type FitModel,
  fitCurve,
  formatCoefficient,
  formatEquation,
} from '@/lib/regression'
import { useThemeColors } from '@/lib/theme-colors'
import { cn } from '@/lib/utils'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type GraphType = 'x-t' | 'y-t' | 'vx-t' | 'vy-t' | 'y-x'

/** Axis variable symbols per graph type — used to render fits in physics form. */
const AXIS_VARS: Record<GraphType, { dep: string; indep: string }> = {
  'x-t': { dep: 'x', indep: 't' },
  'y-t': { dep: 'y', indep: 't' },
  'vx-t': { dep: 'vx', indep: 't' },
  'vy-t': { dep: 'vy', indep: 't' },
  'y-x': { dep: 'y', indep: 'x' },
}

/** Plain-language physics meaning of a fit, for the equation tooltip. */
function interpretFit(type: GraphType, fit: Fit, unit: string): string {
  const c = fit.coefficients
  const isPosition = type === 'x-t' || type === 'y-t'
  const isVelocity = type === 'vx-t' || type === 'vy-t'

  if (fit.model === 'linear') {
    const slope = c[1] ?? 0
    if (isPosition)
      return `The slope is the velocity ≈ ${formatCoefficient(slope)} ${unit}/s; the intercept is the starting position.`
    if (isVelocity)
      return `The slope is the acceleration ≈ ${formatCoefficient(slope)} ${unit}/s²; the intercept is the initial velocity.`
    return 'A straight-line path through space.'
  }

  const c2 = c[2] ?? 0
  if (isPosition)
    return `Constant acceleration: a = 2 × ${formatCoefficient(c2)} = ${formatCoefficient(2 * c2)} ${unit}/s². The ${AXIS_VARS[type].indep}-term is the initial velocity; the constant is the starting position.`
  if (isVelocity)
    return 'A curved velocity–time graph means the acceleration itself is changing over time.'
  return 'A curved path through space.'
}

interface GraphProps {
  type: GraphType
  showRegression?: boolean
  className?: string
}

const GRAPH_LABELS: Record<GraphType, string> = {
  'x-t': 'Position X vs Time',
  'y-t': 'Position Y vs Time',
  'vx-t': 'Velocity X vs Time',
  'vy-t': 'Velocity Y vs Time',
  'y-x': 'Position Y vs X',
}

export function Graph({ type, showRegression = false, className }: GraphProps) {
  const data = useTableData()
  const { currentTime, setCurrentFrame } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()
  const [fitModel, setFitModel] = useState<FitModel>('linear')
  const colors = useThemeColors()

  const { chartData, xKey, yKey, xLabel, yLabel, fit, yDomain, depSym, indepSym } = useMemo(() => {
    let xKey: string
    let yKey: string
    let xLabel: string
    let yLabel: string

    switch (type) {
      case 'x-t':
        xKey = 'time'
        yKey = 'worldX'
        xLabel = 't (s)'
        yLabel = `x (${scaleUnit})`
        break
      case 'y-t':
        xKey = 'time'
        yKey = 'worldY'
        xLabel = 't (s)'
        yLabel = `y (${scaleUnit})`
        break
      case 'vx-t':
        xKey = 'time'
        yKey = 'vx'
        xLabel = 't (s)'
        yLabel = `vx (${scaleUnit}/s)`
        break
      case 'vy-t':
        xKey = 'time'
        yKey = 'vy'
        xLabel = 't (s)'
        yLabel = `vy (${scaleUnit}/s)`
        break
      case 'y-x':
        xKey = 'worldX'
        yKey = 'worldY'
        xLabel = `x (${scaleUnit})`
        yLabel = `y (${scaleUnit})`
        break
    }

    // Filter out null values for the selected axes
    const chartData = data.filter((row) => {
      const xVal = row[xKey as keyof typeof row]
      const yVal = row[yKey as keyof typeof row]
      return xVal !== null && yVal !== null
    })

    // Anchor the y-axis at zero and autoscale from there. A tight [min,max]
    // window magnifies a physically-constant series (e.g. vx for constant-
    // velocity motion) — its pixel-quantization jitter fills the chart and
    // looks chaotic. With zero as the baseline, that variance is shown in honest
    // proportion to the value's magnitude (a near-constant series reads flat).
    // Negatives anchor at the top instead (e.g. a ≈ -9.8 sits below a zero line).
    let yDomain: [number, number] | ['auto', 'auto'] = ['auto', 'auto']
    const yVals = chartData
      .map((row) => row[yKey as keyof typeof row])
      .filter((v): v is number => typeof v === 'number')
    if (yVals.length > 0) {
      const bottom = Math.min(0, ...yVals)
      const top = Math.max(0, ...yVals)
      const pad = (top - bottom || 1) * 0.05
      yDomain = [bottom < 0 ? bottom - pad : 0, top > 0 ? top + pad : 0]
    }

    // Fit the selected model if requested (fitCurve returns null below its
    // minimum point count, so quadratic just won't show until there are 3+).
    let fit = null
    if (showRegression) {
      const points = chartData.map((row) => ({
        x: row[xKey as keyof typeof row] as number,
        y: row[yKey as keyof typeof row] as number,
      }))
      fit = fitCurve(fitModel, points)
    }

    return {
      chartData,
      xKey,
      yKey,
      xLabel,
      yLabel,
      fit,
      yDomain,
      depSym: AXIS_VARS[type].dep,
      indepSym: AXIS_VARS[type].indep,
    }
  }, [data, type, showRegression, fitModel, scaleUnit])

  // Sample the fitted curve across the x-range. Linear needs only its two
  // endpoints; quadratic is sampled densely so it renders as a smooth parabola.
  const fitCurveData = useMemo(() => {
    if (!fit || chartData.length < 2) return null

    const xValues = chartData.map((d) => d[xKey as keyof typeof d] as number)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    if (maxX === minX) return null

    const samples = fit.model === 'quadratic' ? 48 : 2
    const step = (maxX - minX) / (samples - 1)
    // Key the x-value with the chart's actual xKey ('time'/'worldX') so recharts
    // can place these points on the shared X-axis; a literal `x` key leaves the
    // x-domain undefined and blanks the whole chart.
    return Array.from({ length: samples }, (_, i) => {
      const x = minX + step * i
      return { [xKey]: x, y: fit.predict(x) }
    })
  }, [fit, chartData, xKey])

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {GRAPH_LABELS[type]}
          </span>
          {chartData.length > 0 && (
            <span className="hidden font-mono text-[10px] text-muted-foreground md:inline">
              · click a point to jump the video
            </span>
          )}
        </div>
        {showRegression && chartData.length > 0 && (
          <div className="flex items-center gap-3 font-mono text-xs">
            {/* Model selector */}
            <div className="flex rounded-md border border-input p-0.5">
              {FIT_MODELS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setFitModel(m.value)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                    fitModel === m.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {fit ? (
              <>
                <InfoTip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-plasma">
                      {formatEquation(fit, depSym, indepSym)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs space-y-1.5">
                      <p>
                        Math-class form:{' '}
                        <span className="font-mono text-foreground">
                          {formatEquation(fit, 'y', 'x')}
                        </span>
                      </p>
                      <p className="text-muted-foreground">{interpretFit(type, fit, scaleUnit)}</p>
                    </div>
                  </TooltipContent>
                </InfoTip>
                <span className="text-muted-foreground">|</span>
                <InfoTip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-muted-foreground">
                      R² = <span className="text-primary">{fit.rSquared.toFixed(4)}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    How well the curve fits your data — 1.0 is a perfect fit; lower means more
                    scatter.
                  </TooltipContent>
                </InfoTip>
              </>
            ) : (
              <span className="text-muted-foreground">
                need ≥ {fitModel === 'quadratic' ? 3 : 2} points
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 p-4">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              No data to display
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              className="cursor-pointer"
              onClick={(state) => {
                const frame = (
                  state as { activePayload?: Array<{ payload?: { frameNumber?: number } }> }
                )?.activePayload?.[0]?.payload?.frameNumber
                if (typeof frame === 'number') setCurrentFrame(frame)
              }}
            >
              <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" />
              <XAxis
                dataKey={xKey}
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -10,
                  fill: colors.chartTick,
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                type="number"
                domain={['auto', 'auto']}
                tick={{ fill: colors.chartTick, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: colors.chartAxisLine }}
                tickLine={{ stroke: colors.chartAxisLine }}
              />
              <YAxis
                label={{
                  value: yLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: colors.chartTick,
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                type="number"
                domain={yDomain}
                allowDecimals
                tickFormatter={(v: number) => {
                  const a = Math.abs(v)
                  return a >= 100 ? v.toFixed(0) : a >= 1 ? v.toFixed(2) : v.toFixed(3)
                }}
                tick={{ fill: colors.chartTick, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: colors.chartAxisLine }}
                tickLine={{ stroke: colors.chartAxisLine }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.tooltipBg,
                  border: `1px solid ${colors.tooltipBorder}`,
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
                labelStyle={{ color: colors.tooltipText }}
                itemStyle={{ color: colors.dataValue }}
                formatter={(value: number) => value.toFixed(4)}
                labelFormatter={(label: number) => `${xLabel}: ${label.toFixed(4)}`}
              />

              {/* Current time reference line for time-based graphs */}
              {xKey === 'time' && (
                <ReferenceLine
                  x={currentTime}
                  stroke={colors.reference}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              {/* Data points and line */}
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={colors.dataLine}
                strokeWidth={2}
                dot={{ r: 4, fill: colors.dataLine, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: colors.reference, strokeWidth: 0 }}
              />

              {/* Fitted curve */}
              {fitCurveData && (
                <Line
                  data={fitCurveData}
                  type="monotone"
                  dataKey="y"
                  stroke={colors.fitCurve}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
