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
  const { currentTime } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()

  const { chartData, xKey, yKey, xLabel, yLabel, regression } = useMemo(() => {
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

    // Calculate regression if requested
    let regression = null
    if (showRegression && chartData.length >= 2) {
      const points = chartData.map((row) => ({
        x: row[xKey as keyof typeof row] as number,
        y: row[yKey as keyof typeof row] as number,
      }))
      regression = linearRegression(points)
    }

    return { chartData, xKey, yKey, xLabel, yLabel, regression }
  }, [data, type, showRegression, scaleUnit])

  // Generate regression line data
  const regressionLineData = useMemo(() => {
    if (!regression || chartData.length < 2) return null

    const xValues = chartData.map((d) => d[xKey as keyof typeof d] as number)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)

    return [
      { x: minX, y: regression.slope * minX + regression.intercept },
      { x: maxX, y: regression.slope * maxX + regression.intercept },
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
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          {GRAPH_LABELS[type]}
        </span>
        {regression && (
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-zinc-400">
              y = <span className="text-blue-400">{regression.slope.toFixed(4)}</span>x +{' '}
              <span className="text-blue-400">{regression.intercept.toFixed(4)}</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              R² = <span className="text-emerald-400">{regression.rSquared.toFixed(4)}</span>
            </span>
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
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                domain={['auto', 'auto']}
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
                itemStyle={{ color: '#ef4444' }}
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
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fbbf24', strokeWidth: 0 }}
              />

              {/* Regression line */}
              {regressionLineData && (
                <Line
                  data={regressionLineData}
                  type="linear"
                  dataKey="y"
                  stroke="#3b82f6"
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
