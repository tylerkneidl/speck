import { useMemo } from 'react'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'
import { pixelToWorld, type CoordinateSystem } from '@/lib/transforms'
import { calculateVelocity, calculateAcceleration } from '@/lib/kinematics'

export interface TableRow {
  id: string
  rowNumber: number
  frameNumber: number
  time: number
  pixelX: number
  pixelY: number
  worldX: number | null
  worldY: number | null
  vx: number | null
  vy: number | null
  speed: number | null
  ax: number | null
  ay: number | null
}

export function useTableData(): TableRow[] {
  const { dataPoints } = useTrackingStore()
  const { origin, rotation, yAxisUp, pixelsPerUnit } = useCoordinateStore()
  // Time is derived from frame number ÷ frame rate (not the stored value), so
  // correcting the fps retroactively fixes every point's time + kinematics.
  const frameRate = useVideoStore((s) => s.metadata?.frameRate ?? 30)

  return useMemo(() => {
    const coordinateSystem: CoordinateSystem = {
      origin,
      rotation,
      yAxisUp,
      pixelsPerUnit,
    }

    // Sort by frame number and calculate world coordinates
    const sortedPoints = [...dataPoints]
      .sort((a, b) => a.frameNumber - b.frameNumber)
      .map((point) => {
        const world = pixelToWorld({ x: point.pixelX, y: point.pixelY }, coordinateSystem)
        return {
          ...point,
          worldX: world?.x ?? null,
          worldY: world?.y ?? null,
        }
      })

    // Build data array for kinematics calculations
    const kinematicsData = sortedPoints
      .filter((p) => p.worldX !== null && p.worldY !== null)
      .map((p) => ({
        time: p.frameNumber / frameRate,
        x: p.worldX!,
        y: p.worldY!,
      }))

    // Calculate velocities and accelerations
    return sortedPoints.map((point, index) => {
      const time = point.frameNumber / frameRate
      const kinematicsIndex = kinematicsData.findIndex((k) => Math.abs(k.time - time) < 0.0001)

      const velocity =
        kinematicsIndex >= 0 ? calculateVelocity(kinematicsData, kinematicsIndex) : null

      const acceleration =
        kinematicsIndex >= 0 ? calculateAcceleration(kinematicsData, kinematicsIndex) : null

      return {
        id: point.id,
        rowNumber: index + 1,
        frameNumber: point.frameNumber,
        time,
        pixelX: point.pixelX,
        pixelY: point.pixelY,
        worldX: point.worldX,
        worldY: point.worldY,
        vx: velocity?.vx ?? null,
        vy: velocity?.vy ?? null,
        speed: velocity?.speed ?? null,
        ax: acceleration?.ax ?? null,
        ay: acceleration?.ay ?? null,
      }
    })
  }, [dataPoints, origin, rotation, yAxisUp, pixelsPerUnit, frameRate])
}
