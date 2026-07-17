import { useCallback, type ReactNode } from 'react'
import { Download, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useCoordinateStore } from '@/stores/coordinates'
import { useUiStore } from '@/stores/ui'
import { useTableData, type TableRow as DataRow } from '../hooks/useTableData'
import { exportTableData } from '@/lib/export'
import { cn } from '@/lib/utils'

interface DataTableProps {
  className?: string
}

/** A column label that explains itself in plain language on hover. */
function HeadTip({ children, tip }: { children: ReactNode; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-2 hover:decoration-foreground">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

export function DataTable({ className }: DataTableProps) {
  const { selectedPointId, selectPoint, deletePoint } = useTrackingStore()
  const { setCurrentFrame } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()
  const { detailLevel, setDetailLevel } = useUiStore()
  const advanced = detailLevel === 'advanced'
  const data = useTableData()

  const handleRowClick = useCallback(
    (row: DataRow) => {
      selectPoint(row.id)
      setCurrentFrame(row.frameNumber)
    },
    [selectPoint, setCurrentFrame]
  )

  const formatNumber = (value: number | null, decimals = 3) => {
    if (value === null) return '—'
    return value.toFixed(decimals)
  }

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      {/* Header with title + export */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Motion Data</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-input p-0.5">
            <button
              type="button"
              onClick={() => setDetailLevel('basic')}
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                !advanced ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Basic
            </button>
            <button
              type="button"
              onClick={() => setDetailLevel('advanced')}
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                advanced ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Advanced
            </button>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'point' : 'points'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportTableData(data, 'speck', scaleUnit)}
            disabled={data.length === 0}
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 font-mono text-xs text-muted-foreground">#</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">
                <HeadTip tip="Time since the first tracked point, in seconds.">t (s)</HeadTip>
              </TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">
                <HeadTip tip="Horizontal position — distance sideways from the origin you set.">x ({scaleUnit})</HeadTip>
              </TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">
                <HeadTip tip="Vertical position — distance up or down from the origin you set.">y ({scaleUnit})</HeadTip>
              </TableHead>
              {advanced && (
                <>
                  <TableHead className="font-mono text-xs text-muted-foreground">
                    <HeadTip tip="Velocity in x — how fast it moves sideways (change in x each second).">vx ({scaleUnit}/s)</HeadTip>
                  </TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">
                    <HeadTip tip="Velocity in y — how fast it moves up or down (change in y each second).">vy ({scaleUnit}/s)</HeadTip>
                  </TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">
                    <HeadTip tip="Speed — how fast it's moving overall, combining vx and vy.">|v| ({scaleUnit}/s)</HeadTip>
                  </TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">
                    <HeadTip tip="Acceleration in x — how quickly the sideways velocity changes.">ax ({scaleUnit}/s²)</HeadTip>
                  </TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground">
                    <HeadTip tip="Acceleration in y — how quickly the up/down velocity changes. Gravity shows up here.">ay ({scaleUnit}/s²)</HeadTip>
                  </TableHead>
                </>
              )}
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                className={cn(
                  'group cursor-pointer border-border transition-colors',
                  selectedPointId === row.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                  {row.rowNumber}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.time)}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.worldX)}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.worldY)}</TableCell>
                {advanced && (
                  <>
                    <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.vx)}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.vy)}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      <span className={row.speed !== null ? 'text-primary' : ''}>{formatNumber(row.speed)}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.ax)}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{formatNumber(row.ay)}</TableCell>
                  </>
                )}
                <TableCell className="w-8 p-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePoint(row.id)
                    }}
                    title="Delete point"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={advanced ? 10 : 5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      No data points tracked
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Click on the video to mark object positions
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
