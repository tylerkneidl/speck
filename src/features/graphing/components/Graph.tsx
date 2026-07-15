import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTableData } from '@/features/data-table/hooks/useTableData'
import { useVideoStore } from '@/stores/video'
import { useCoordinateStore } from '@/stores/coordinates'
import { linearRegression } from '@/lib/kinematics'
import { Tooltip as InfoTip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type GraphType = 'x-t' | 'y-t' | 'vx-t' | 'vy-t' | 'y-x'

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

  const { chartData, xKey, yKey, xLabel, yLabel, regression, yDomain } = useMemo(() => {
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

    // Calculate regression if requested
    let regression = null
    if (showRegression && chartData.length >= 2) {
      const points = chartData.map((row) => ({
        x: row[xKey as keyof typeof row] as number,
        y: row[yKey as keyof typeof row] as number,
      }))
      regression = linearRegression(points)
    }

    return { chartData, xKey, yKey, xLabel, yLabel, regression, yDomain }
  }, [data, type, showRegression, scaleUnit])

  // Generate regression line data
  const regressionLineData = useMemo(() => {
    if (!regression || chartData.length < 2) return null

    const xValues = chartData.map((d) => d[xKey as keyof typeof d] as number)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)

    // Key the x-value with the chart's actual xKey ('time'/'worldX') so recharts
    // can place these points on the shared X-axis; a literal `x` key leaves the
    // x-domain undefined and blanks the whole chart.
    return [
      { [xKey]: minX, y: regression.slope * minX + regression.intercept },
      { [xKey]: maxX, y: regression.slope * maxX + regression.intercept },
    ]
  }, [regression, chartData, xKey])

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            {GRAPH_LABELS[type]}
          </span>
          {chartData.length > 0 && (
            <span className="hidden font-mono text-[10px] text-zinc-600 md:inline">
              · click a point to jump the video
            </span>
          )}
        </div>
        {regression && (
          <div className="flex items-center gap-4 font-mono text-xs">
            <InfoTip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-zinc-400">
                  y = <span className="text-plasma">{regression.slope.toFixed(4)}</span>x +{' '}
                  <span className="text-plasma">{regression.intercept.toFixed(4)}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                The best-fit straight line through your points. On a position-vs-time graph the
                slope is the velocity; on a velocity-vs-time graph it's the acceleration.
              </TooltipContent>
            </InfoTip>
            <span className="text-zinc-600">|</span>
            <InfoTip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-zinc-400">
                  R² = <span className="text-emerald-400">{regression.rSquared.toFixed(4)}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                How well the straight line fits your data — 1.0 is a perfect fit; lower means more
                scatter.
              </TooltipContent>
            </InfoTip>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 p-4">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-600">
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
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey={xKey}
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#71717a',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                type="number"
                domain={['auto', 'auto']}
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                label={{
                  value: yLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: '#71717a',
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
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#ff4e22' }}
                formatter={(value: number) => value.toFixed(4)}
                labelFormatter={(label: number) => `${xLabel}: ${label.toFixed(4)}`}
              />

              {/* Current time reference line for time-based graphs */}
              {xKey === 'time' && (
                <ReferenceLine
                  x={currentTime}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              {/* Data points and line */}
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#ff4e22"
                strokeWidth={2}
                dot={{ r: 4, fill: '#ff4e22', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fbbf24', strokeWidth: 0 }}
              />

              {/* Regression line */}
              {regressionLineData && (
                <Line
                  data={regressionLineData}
                  type="linear"
                  dataKey="y"
                  stroke="#27e0cf"
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
