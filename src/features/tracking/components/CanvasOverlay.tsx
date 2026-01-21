import { useCallback, useEffect, useRef } from 'react'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'

interface CanvasOverlayProps {
  width: number
  height: number
  onClick?: (pixelX: number, pixelY: number) => void
}

export function CanvasOverlay({ width, height, onClick }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { dataPoints, selectedPointId, trailLength } = useTrackingStore()
  const { origin, rotation, scalePoint1, scalePoint2 } = useCoordinateStore()
  const { currentFrame } = useVideoStore()

  // Draw overlay content
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw coordinate system
    drawCoordinateSystem(ctx, origin, rotation, scalePoint1, scalePoint2, width, height)

    // Draw tracked points and path
    drawPoints(ctx, dataPoints, selectedPointId, currentFrame, trailLength)
  }, [
    width,
    height,
    origin,
    rotation,
    scalePoint1,
    scalePoint2,
    dataPoints,
    selectedPointId,
    currentFrame,
    trailLength,
  ])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onClick) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const pixelX = (e.clientX - rect.left) * scaleX
      const pixelY = (e.clientY - rect.top) * scaleY

      onClick(pixelX, pixelY)
    },
    [onClick]
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="absolute inset-0 cursor-crosshair"
      style={{ width, height }}
    />
  )
}

function drawCoordinateSystem(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  rotation: number,
  scalePoint1: { x: number; y: number } | null,
  scalePoint2: { x: number; y: number } | null,
  canvasWidth: number,
  canvasHeight: number
) {
  const rotationRad = (rotation * Math.PI) / 180

  // Draw origin crosshairs
  ctx.save()
  ctx.translate(origin.x, origin.y)
  ctx.rotate(rotationRad)

  // Axis style - technical green
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])

  // X-axis (extends across canvas)
  ctx.beginPath()
  ctx.moveTo(-canvasWidth, 0)
  ctx.lineTo(canvasWidth, 0)
  ctx.stroke()

  // Y-axis
  ctx.beginPath()
  ctx.moveTo(0, -canvasHeight)
  ctx.lineTo(0, canvasHeight)
  ctx.stroke()

  // Tick marks on axes
  ctx.strokeStyle = '#22c55e80'
  ctx.lineWidth = 1
  const tickSpacing = 50
  const tickSize = 6

  for (let i = -Math.ceil(canvasWidth / tickSpacing); i <= Math.ceil(canvasWidth / tickSpacing); i++) {
    if (i === 0) continue
    const x = i * tickSpacing
    ctx.beginPath()
    ctx.moveTo(x, -tickSize)
    ctx.lineTo(x, tickSize)
    ctx.stroke()
  }

  for (let i = -Math.ceil(canvasHeight / tickSpacing); i <= Math.ceil(canvasHeight / tickSpacing); i++) {
    if (i === 0) continue
    const y = i * tickSpacing
    ctx.beginPath()
    ctx.moveTo(-tickSize, y)
    ctx.lineTo(tickSize, y)
    ctx.stroke()
  }

  // Origin marker - concentric circles for precision look
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(0, 0, 2, 0, 2 * Math.PI)
  ctx.fill()

  ctx.restore()

  // Draw scale reference line
  if (scalePoint1 && scalePoint2) {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])

    ctx.beginPath()
    ctx.moveTo(scalePoint1.x, scalePoint1.y)
    ctx.lineTo(scalePoint2.x, scalePoint2.y)
    ctx.stroke()

    // Scale point markers - diamond shape for distinctiveness
    ctx.fillStyle = '#3b82f6'
    ctx.setLineDash([])

    drawDiamond(ctx, scalePoint1.x, scalePoint1.y, 8)
    drawDiamond(ctx, scalePoint2.x, scalePoint2.y, 8)
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x + size, y)
  ctx.lineTo(x, y + size)
  ctx.lineTo(x - size, y)
  ctx.closePath()
  ctx.fill()
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  dataPoints: Array<{ id: string; frameNumber: number; pixelX: number; pixelY: number }>,
  selectedPointId: string | null,
  currentFrame: number,
  trailLength: number
) {
  if (dataPoints.length === 0) return

  // Sort points by frame number
  const sortedPoints = [...dataPoints].sort((a, b) => a.frameNumber - b.frameNumber)

  // Determine which points to show based on trail length
  let visiblePoints = sortedPoints
  if (trailLength > 0) {
    const currentIndex = sortedPoints.findIndex((p) => p.frameNumber >= currentFrame)
    if (currentIndex !== -1) {
      const startIndex = Math.max(0, currentIndex - trailLength)
      visiblePoints = sortedPoints.slice(startIndex, currentIndex + 1)
    }
  }

  // Draw path connecting points with gradient fade
  if (visiblePoints.length > 1) {
    for (let i = 1; i < visiblePoints.length; i++) {
      const prev = visiblePoints[i - 1]!
      const curr = visiblePoints[i]!

      // Calculate opacity based on position in trail
      const opacity = trailLength > 0 ? 0.3 + (0.7 * i) / visiblePoints.length : 0.8

      ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(prev.pixelX, prev.pixelY)
      ctx.lineTo(curr.pixelX, curr.pixelY)
      ctx.stroke()
    }
  }

  // Draw points
  for (let i = 0; i < visiblePoints.length; i++) {
    const point = visiblePoints[i]!
    const isSelected = point.id === selectedPointId
    const isCurrent = point.frameNumber === currentFrame

    // Calculate opacity for older points
    const opacity = trailLength > 0 ? 0.4 + (0.6 * i) / visiblePoints.length : 1

    // Point appearance
    const radius = isCurrent ? 7 : 5
    const fillColor = isCurrent ? '#fbbf24' : `rgba(239, 68, 68, ${opacity})`

    // Outer glow for current point
    if (isCurrent) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'
      ctx.beginPath()
      ctx.arc(point.pixelX, point.pixelY, 12, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(point.pixelX, point.pixelY, radius + 4, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Main point
    ctx.fillStyle = fillColor
    ctx.beginPath()
    ctx.arc(point.pixelX, point.pixelY, radius, 0, 2 * Math.PI)
    ctx.fill()

    // Center dot for precision
    if (isCurrent) {
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(point.pixelX, point.pixelY, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
}
