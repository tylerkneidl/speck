import { useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useCoordinateStore } from '@/stores/coordinates'
import { useTableData, type TableRow as DataRow } from '../hooks/useTableData'
import { cn } from '@/lib/utils'

interface DataTableProps {
  className?: string
}

export function DataTable({ className }: DataTableProps) {
  const { selectedPointId, selectPoint } = useTrackingStore()
  const { setCurrentFrame } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()
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
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900', className)}>
      {/* Header with title */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Motion Data
        </span>
        <span className="font-mono text-xs text-zinc-600">
          {data.length} {data.length === 1 ? 'point' : 'points'}
        </span>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-12 font-mono text-xs text-zinc-500">#</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">t (s)</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">x ({scaleUnit})</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">y ({scaleUnit})</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">vx ({scaleUnit}/s)</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">vy ({scaleUnit}/s)</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">|v| ({scaleUnit}/s)</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">ax ({scaleUnit}/s²)</TableHead>
              <TableHead className="font-mono text-xs text-zinc-500">ay ({scaleUnit}/s²)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                className={cn(
                  'cursor-pointer border-zinc-800 transition-colors',
                  selectedPointId === row.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
              >
                <TableCell className="font-mono text-xs font-medium text-zinc-500">
                  {row.rowNumber}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.time)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.worldX)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.worldY)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.vx)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.vy)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  <span className={row.speed !== null ? 'text-emerald-400' : ''}>
                    {formatNumber(row.speed)}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.ax)}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {formatNumber(row.ay)}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-600">
                      No data points tracked
                    </span>
                    <span className="text-xs text-zinc-700">
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
