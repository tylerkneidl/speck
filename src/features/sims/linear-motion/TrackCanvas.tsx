'use client'

import { createLayer, fitCanvas } from '@/features/sims/notebook/canvas'
import { useNotebookColors } from '@/features/sims/notebook/colors'
import { type Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import rough from 'roughjs'
import { type TrackFrame, drawTrackFrame, drawTrackStatic } from './track-drawing'

export interface TrackCanvasHandle {
  draw(frame: TrackFrame): void
}

interface TrackCanvasProps {
  initialFrame: TrackFrame
  className?: string
  ref?: Ref<TrackCanvasHandle>
}

/** The toy car on its track. The track and meter stick are cached; each draw() adds the car. */
export function TrackCanvas({ initialFrame, className, ref }: TrackCanvasProps) {
  const colors = useNotebookColors()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null)
  const frameRef = useRef(initialFrame)

  const draw = useCallback(
    (frame: TrackFrame) => {
      frameRef.current = frame
      const canvas = canvasRef.current
      if (!canvas) return
      const { ctx, width, height, dpr } = fitCanvas(canvas)
      if (width === 0 || height === 0) return
      const key = `${width}x${height}@${dpr}|${colors.page}`
      if (layerRef.current?.key !== key) {
        const layer = createLayer(width, height, dpr, (lctx, lcanvas) =>
          drawTrackStatic(lctx, rough.canvas(lcanvas), width, height, colors),
        )
        layerRef.current = { key, canvas: layer }
      }
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(layerRef.current.canvas, 0, 0, width, height)
      drawTrackFrame(ctx, rough.canvas(canvas), frame, width, height, colors)
    },
    [colors],
  )

  useImperativeHandle(ref, () => ({ draw }), [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const redraw = () => draw(frameRef.current)
    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    document.fonts?.ready.then(() => {
      layerRef.current = null
      redraw()
    })
    return () => observer.disconnect()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Toy car on a 10 meter track with a meter stick"
    />
  )
}
