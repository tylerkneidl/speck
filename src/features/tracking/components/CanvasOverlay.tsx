import { useCoordinateStore } from '@/stores/coordinates'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useCallback, useEffect, useRef } from 'react'

interface CanvasOverlayProps {
  width: number
  height: number
  onClick?: (pixelX: number, pixelY: number) => void
  /** Allow dragging existing tracked points to reposition them (Track mode). */
  enableDrag?: boolean
}

const LOUPE_SIZE = 132 // magnifier diameter, display px
const LOUPE_CROP = 48 // native px sampled under the cursor
const LOUPE_ZOOM = LOUPE_SIZE / LOUPE_CROP
const HIT_RADIUS = 14 // native px — how close a click/grab must be to a point

interface DragState {
  id: string
  startX: number
  startY: number
  x: number
  y: number
  moved: boolean
}

export function CanvasOverlay({ width, height, onClick, enableDrag = false }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loupeRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)

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

    // While a point is being dragged, render it at the live cursor position
    // (the store isn't touched until pointer-up, so undo stays one step).
    const drag = dragRef.current
    const points = drag
      ? dataPoints.map((p) => (p.id === drag.id ? { ...p, pixelX: drag.x, pixelY: drag.y } : p))
      : dataPoints

    // Draw tracked points and path
    drawPoints(ctx, points, selectedPointId, currentFrame, trailLength)
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

  // Convert a client (screen) coordinate to a native canvas pixel.
  const toNative = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  // Nearest tracked point within HIT_RADIUS of (x, y), or null.
  const hitTest = useCallback((x: number, y: number): string | null => {
    let best: string | null = null
    let bestDist = HIT_RADIUS
    for (const p of useTrackingStore.getState().dataPoints) {
      const d = Math.hypot(p.pixelX - x, p.pixelY - y)
      if (d <= bestDist) {
        best = p.id
        bestDist = d
      }
    }
    return best
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Swallow the click that ends a drag so it doesn't also add/select.
      if (didDragRef.current) {
        didDragRef.current = false
        return
      }
      if (!onClick) return
      const { x, y } = toNative(e.clientX, e.clientY)
      onClick(x, y)
    },
    [onClick, toNative],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      didDragRef.current = false
      if (!enableDrag) return
      const { x, y } = toNative(e.clientX, e.clientY)
      const id = hitTest(x, y)
      if (!id) return // empty space → let the click add a point
      canvasRef.current?.setPointerCapture(e.pointerId)
      dragRef.current = { id, startX: x, startY: y, x, y, moved: false }
      useTrackingStore.getState().selectPoint(id)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    },
    [enableDrag, toNative, hitTest],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag) return
      canvasRef.current?.releasePointerCapture(e.pointerId)
      if (drag.moved) {
        // One store write for the whole drag → one clean undo step.
        useTrackingStore.getState().updatePoint(drag.id, { x: drag.x, y: drag.y })
        didDragRef.current = true
      }
      dragRef.current = null
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
      draw()
    },
    [draw],
  )

  // Magnifier: sample the video frame under the cursor at native resolution so
  // students can place points on the exact pixel. Drawn imperatively (no React
  // re-render per pointer move) for smoothness.
  const drawLoupe = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const loupe = loupeRef.current
    if (!canvas || !loupe) return
    const lctx = loupe.getContext('2d')
    if (!lctx) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const nx = (clientX - rect.left) * scaleX // native pixel under cursor
    const ny = (clientY - rect.top) * scaleY
    const video = canvas.parentElement?.querySelector('video') as HTMLVideoElement | null

    lctx.imageSmoothingEnabled = false // crisp pixels for precise placement
    lctx.fillStyle = '#090b11'
    lctx.fillRect(0, 0, LOUPE_SIZE, LOUPE_SIZE)
    if (video?.videoWidth) {
      lctx.drawImage(
        video,
        nx - LOUPE_CROP / 2,
        ny - LOUPE_CROP / 2,
        LOUPE_CROP,
        LOUPE_CROP,
        0,
        0,
        LOUPE_SIZE,
        LOUPE_SIZE,
      )
    }

    // Existing tracked points, magnified into the loupe
    for (const p of useTrackingStore.getState().dataPoints) {
      const dx = (p.pixelX - nx) * LOUPE_ZOOM + LOUPE_SIZE / 2
      const dy = (p.pixelY - ny) * LOUPE_ZOOM + LOUPE_SIZE / 2
      if (dx >= 0 && dx <= LOUPE_SIZE && dy >= 0 && dy <= LOUPE_SIZE) {
        lctx.fillStyle = 'rgba(255, 78, 34, 0.85)'
        lctx.beginPath()
        lctx.arc(dx, dy, 4, 0, 2 * Math.PI)
        lctx.fill()
      }
    }

    // Crosshair on the exact target pixel
    lctx.strokeStyle = 'rgba(255, 122, 69, 0.95)'
    lctx.lineWidth = 1
    lctx.beginPath()
    lctx.moveTo(LOUPE_SIZE / 2, 0)
    lctx.lineTo(LOUPE_SIZE / 2, LOUPE_SIZE)
    lctx.moveTo(0, LOUPE_SIZE / 2)
    lctx.lineTo(LOUPE_SIZE, LOUPE_SIZE / 2)
    lctx.stroke()

    // Position near the cursor, flipping at edges to stay in view
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const off = 28
    let lx = localX + off
    let ly = localY + off
    if (lx + LOUPE_SIZE > rect.width) lx = localX - off - LOUPE_SIZE
    if (ly + LOUPE_SIZE > rect.height) ly = localY - off - LOUPE_SIZE
    loupe.style.left = `${Math.max(4, lx)}px`
    loupe.style.top = `${Math.max(4, ly)}px`
    loupe.style.opacity = '1'
  }, [])

  const hideLoupe = useCallback(() => {
    const loupe = loupeRef.current
    if (loupe) loupe.style.opacity = '0'
  }, [])

  // Defined after drawLoupe (which it calls). Handles the loupe, live dragging,
  // and the hover cursor in one pointer-move pass.
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      drawLoupe(e.clientX, e.clientY)
      const drag = dragRef.current
      if (drag) {
        const { x, y } = toNative(e.clientX, e.clientY)
        drag.x = x
        drag.y = y
        if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) > 3) drag.moved = true
        draw()
        return
      }
      // Hover affordance: grab cursor when over a draggable point.
      const canvas = canvasRef.current
      if (canvas) {
        const { x, y } = toNative(e.clientX, e.clientY)
        canvas.style.cursor = enableDrag && hitTest(x, y) ? 'grab' : 'crosshair'
      }
    },
    [drawLoupe, toNative, draw, enableDrag, hitTest],
  )

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pixel-coordinate canvas — clicks/drags carry an (x,y) that has no keyboard equivalent. */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={hideLoupe}
        className="absolute inset-0 z-10 h-full w-full cursor-crosshair"
      />
      <canvas
        ref={loupeRef}
        width={LOUPE_SIZE}
        height={LOUPE_SIZE}
        className="pointer-events-none absolute z-30 rounded-full opacity-0 transition-opacity duration-100"
        style={{
          width: LOUPE_SIZE,
          height: LOUPE_SIZE,
          boxShadow: '0 0 0 2px #ff4e22, 0 6px 20px rgba(0,0,0,0.55)',
        }}
      />
    </>
  )
}

function drawCoordinateSystem(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  rotation: number,
  scalePoint1: { x: number; y: number } | null,
  scalePoint2: { x: number; y: number } | null,
  canvasWidth: number,
  canvasHeight: number,
) {
  const rotationRad = (rotation * Math.PI) / 180

  // Draw origin crosshairs
  ctx.save()
  ctx.translate(origin.x, origin.y)
  ctx.rotate(rotationRad)

  // Axis style - technical green
  ctx.strokeStyle = '#27e0cf'
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
  ctx.strokeStyle = '#27e0cf80'
  ctx.lineWidth = 1
  const tickSpacing = 50
  const tickSize = 6

  for (
    let i = -Math.ceil(canvasWidth / tickSpacing);
    i <= Math.ceil(canvasWidth / tickSpacing);
    i++
  ) {
    if (i === 0) continue
    const x = i * tickSpacing
    ctx.beginPath()
    ctx.moveTo(x, -tickSize)
    ctx.lineTo(x, tickSize)
    ctx.stroke()
  }

  for (
    let i = -Math.ceil(canvasHeight / tickSpacing);
    i <= Math.ceil(canvasHeight / tickSpacing);
    i++
  ) {
    if (i === 0) continue
    const y = i * tickSpacing
    ctx.beginPath()
    ctx.moveTo(-tickSize, y)
    ctx.lineTo(tickSize, y)
    ctx.stroke()
  }

  // Origin marker - concentric circles for precision look
  ctx.fillStyle = '#27e0cf'
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = '#27e0cf'
  ctx.beginPath()
  ctx.arc(0, 0, 2, 0, 2 * Math.PI)
  ctx.fill()

  ctx.restore()

  // Draw each scale marker as it's placed (so you see point 1 before point 2),
  // and connect them with the reference line once both exist.
  ctx.setLineDash([])
  if (scalePoint1 && scalePoint2) {
    ctx.strokeStyle = '#2f83bb'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(scalePoint1.x, scalePoint1.y)
    ctx.lineTo(scalePoint2.x, scalePoint2.y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  if (scalePoint1) drawScaleMarker(ctx, scalePoint1.x, scalePoint1.y, '1')
  if (scalePoint2) drawScaleMarker(ctx, scalePoint2.x, scalePoint2.y, '2')
}

function drawScaleMarker(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.fillStyle = '#2f83bb'
  drawDiamond(ctx, x, y, 8)
  // number label above the marker so you can tell point 1 from point 2
  ctx.fillStyle = '#bfe0ff'
  ctx.font = 'bold 11px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(label, x, y - 11)
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
  trailLength: number,
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

      ctx.strokeStyle = `rgba(255, 78, 34, ${opacity})`
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
    const fillColor = isCurrent ? '#fbbf24' : `rgba(255, 78, 34, ${opacity})`

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
