import type { RoughCanvas } from 'roughjs/bin/canvas'
import { pen } from './canvas'
import { NOTEBOOK_FONTS, type NotebookColors } from './colors'
import { type LinearScale, clamp, linearScale, ticks } from './scale'

/** What a notebook graph plots: one quantity against time. */
export interface GraphSpec {
  /** Hand-lettered title, e.g. "position  x (m)". */
  label: string
  tMax: number
  tStep: number
  min: number
  max: number
  step: number
}

export interface GraphPoint {
  t: number
  value: number
}

/** Everything that changes while a sim runs. */
export interface GraphFrame {
  samples: GraphPoint[]
  /** The moving dot at the current time. */
  cursor?: GraphPoint
  /** A curve to match, drawn as dashed red pen. */
  target?: (t: number) => number
  /** Pencil strokes a student sketched before running. */
  prediction?: GraphPoint[][]
}

export const GRAPH_PADDING = { left: 40, right: 44, top: 26, bottom: 24 } as const

export function graphScales(spec: GraphSpec, width: number, height: number) {
  const p = GRAPH_PADDING
  return {
    x: linearScale([0, spec.tMax], [p.left, width - p.right]),
    y: linearScale([spec.min, spec.max], [height - p.bottom, p.top]),
  }
}

/** The parts that only change with size or theme: plot area, grid, pen axes, tick numbers, labels. */
export function drawGraphStatic(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  spec: GraphSpec,
  width: number,
  height: number,
  colors: NotebookColors,
) {
  const { x, y } = graphScales(spec, width, height)
  const p = GRAPH_PADDING
  ctx.fillStyle = colors.plotFill
  ctx.fillRect(x(0), y(spec.max), x(spec.tMax) - x(0), y(spec.min) - y(spec.max))

  // Graph-paper grid lined up with the data: minor every half tick, major on ticks.
  ctx.lineWidth = 1
  for (const t of ticks(0, spec.tMax, spec.tStep / 2)) {
    ctx.strokeStyle = isMultiple(t, spec.tStep) ? colors.gridMajor : colors.gridMinor
    strokeLine(ctx, x(t), y(spec.min), x(t), y(spec.max))
  }
  for (const v of ticks(spec.min, spec.max, spec.step / 4)) {
    ctx.strokeStyle = isMultiple(v, spec.step) ? colors.gridMajor : colors.gridMinor
    strokeLine(ctx, x(0), y(v), x(spec.tMax), y(v))
  }

  const zero = clamp(0, spec.min, spec.max)
  rc.line(x(0), y(zero), x(spec.tMax) + 6, y(zero), pen(colors, 61))
  rc.line(x(0), y(spec.min) + 3, x(0), y(spec.max) - 6, pen(colors, 62))

  ctx.fillStyle = colors.inkSoft
  ctx.font = `10px ${NOTEBOOK_FONTS.mono}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const v of ticks(spec.min, spec.max, spec.step)) ctx.fillText(String(v), x(0) - 6, y(v))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const t of ticks(0, spec.tMax, spec.tStep))
    ctx.fillText(String(t), x(t), height - p.bottom + 5)

  ctx.fillStyle = colors.ink
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = `19px ${NOTEBOOK_FONTS.hand}`
  ctx.fillText(spec.label, x(0) + 8, p.top - 7)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.font = `16px ${NOTEBOOK_FONTS.hand}`
  ctx.fillText('t (s)', width - 2, y(zero))
}

/** The parts that change every frame: target, pencil prediction, the ink line, the cursor dot. */
export function drawGraphFrame(
  ctx: CanvasRenderingContext2D,
  spec: GraphSpec,
  frame: GraphFrame,
  width: number,
  height: number,
  colors: NotebookColors,
) {
  const { x, y } = graphScales(spec, width, height)
  const yc = (v: number) => y(clamp(v, spec.min, spec.max))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (frame.target) {
    const target = frame.target
    ctx.strokeStyle = colors.redPen
    ctx.lineWidth = 2.4
    ctx.setLineDash([7, 5])
    polyline(
      ctx,
      ticks(0, spec.tMax, spec.tMax / 200).map((t) => ({ t, value: target(t) })),
      x,
      yc,
    )
    ctx.setLineDash([])
  }

  if (frame.prediction?.length) {
    ctx.strokeStyle = colors.pencil
    ctx.lineWidth = 2.2
    ctx.globalAlpha = 0.85
    for (const stroke of frame.prediction) polyline(ctx, stroke, x, yc)
    ctx.globalAlpha = 1
  }

  ctx.strokeStyle = colors.ink
  ctx.lineWidth = 2.4
  polyline(ctx, frame.samples, x, yc)

  if (frame.cursor) {
    ctx.fillStyle = colors.ink
    ctx.beginPath()
    ctx.arc(x(frame.cursor.t), yc(frame.cursor.value), 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function polyline(
  ctx: CanvasRenderingContext2D,
  points: GraphPoint[],
  x: LinearScale,
  y: (v: number) => number,
) {
  if (points.length < 2) return
  ctx.beginPath()
  points.forEach((p, i) => (i ? ctx.lineTo(x(p.t), y(p.value)) : ctx.moveTo(x(p.t), y(p.value))))
  ctx.stroke()
}

function strokeLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

const isMultiple = (value: number, step: number) =>
  Math.abs(value / step - Math.round(value / step)) < 1e-6
