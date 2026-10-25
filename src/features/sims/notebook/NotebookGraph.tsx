'use client'

import { type Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import rough from 'roughjs'
import { createLayer, fitCanvas } from './canvas'
import { useNotebookColors } from './colors'
import { type GraphFrame, type GraphSpec, drawGraphFrame, drawGraphStatic } from './graph'

export interface NotebookGraphHandle {
  /** Redraws the moving parts. Cheap enough to call every animation frame. */
  draw(frame: GraphFrame): void
}

interface NotebookGraphProps {
  spec: GraphSpec
  /** What to show before the first draw() call. */
  initialFrame?: GraphFrame
  className?: string
  ariaLabel: string
  ref?: Ref<NotebookGraphHandle>
}

const EMPTY: GraphFrame = { samples: [] }

/**
 * A quantity-vs-time graph drawn like it was plotted in a lab notebook. The grid, pen axes and
 * labels are cached in an offscreen layer; each draw() only adds the data on top.
 */
export function NotebookGraph({
  spec,
  initialFrame,
  className,
  ariaLabel,
  ref,
}: NotebookGraphProps) {
  const colors = useNotebookColors()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null)
  const frameRef = useRef<GraphFrame>(initialFrame ?? EMPTY)

  const draw = useCallback(
    (frame: GraphFrame) => {
      frameRef.current = frame
      const canvas = canvasRef.current
      if (!canvas) return
      const { ctx, width, height, dpr } = fitCanvas(canvas)
      if (width === 0 || height === 0) return
      const key = `${width}x${height}@${dpr}|${colors.page}|${JSON.stringify(spec)}`
      if (layerRef.current?.key !== key) {
        const layer = createLayer(width, height, dpr, (lctx, lcanvas) =>
          drawGraphStatic(lctx, rough.canvas(lcanvas), spec, width, height, colors),
        )
        layerRef.current = { key, canvas: layer }
      }
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(layerRef.current.canvas, 0, 0, width, height)
      drawGraphFrame(ctx, spec, frame, width, height, colors)
    },
    [colors, spec],
  )

  useImperativeHandle(ref, () => ({ draw }), [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const redraw = () => draw(frameRef.current)
    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    // Labels are canvas text, so redraw once the handwriting fonts arrive.
    document.fonts?.ready.then(() => {
      layerRef.current = null
      redraw()
    })
    return () => observer.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} className={className} role="img" aria-label={ariaLabel} />
}
