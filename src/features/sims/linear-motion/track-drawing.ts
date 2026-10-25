import type { Body1D } from '@/features/sims/engine'
import { pen } from '@/features/sims/notebook/canvas'
import { NOTEBOOK_FONTS, type NotebookColors } from '@/features/sims/notebook/colors'
import { linearScale } from '@/features/sims/notebook/scale'
import type { RoughCanvas } from 'roughjs/bin/canvas'

export const TRACK_LENGTH_M = 10
const LABEL_GAP_PX = 22

/** Where things sit on the track canvas, in CSS pixels. */
export function trackLayout(width: number, height: number) {
  const ground = height - 62
  return {
    x: linearScale([0, TRACK_LENGTH_M], [30, width - 30]),
    ground,
    dotsY: 36,
    wheelRadius: 8,
  }
}

/** Track, meter stick and end stops: drawn once per size and theme. */
export function drawTrackStatic(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  width: number,
  height: number,
  colors: NotebookColors,
) {
  const { x, ground, dotsY } = trackLayout(width, height)
  const left = x(0)
  const right = x(TRACK_LENGTH_M)

  rc.line(left, dotsY, right, dotsY, pen(colors, 11, { stroke: colors.inkSoft, strokeWidth: 1 }))
  rc.line(left - 8, ground, right + 8, ground, pen(colors, 3, { strokeWidth: 2 }))
  rc.rectangle(
    left,
    ground + 8,
    right - left,
    22,
    pen(colors, 5, {
      strokeWidth: 1.3,
      fill: colors.ruler,
      fillStyle: 'hachure',
      hachureGap: 7,
      fillWeight: 0.8,
    }),
  )
  rc.line(left - 8, ground, left - 8, ground - 26, pen(colors, 7, { strokeWidth: 2 }))
  rc.line(right + 8, ground, right + 8, ground - 26, pen(colors, 8, { strokeWidth: 2 }))

  ctx.strokeStyle = colors.ink
  ctx.lineWidth = 1
  for (let half = 0; half <= TRACK_LENGTH_M * 2; half++) {
    const px = x(half / 2)
    ctx.beginPath()
    ctx.moveTo(px, ground + 8)
    ctx.lineTo(px, ground + 8 + (half % 2 === 0 ? 11 : 6))
    ctx.stroke()
  }
  ctx.fillStyle = colors.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `11px ${NOTEBOOK_FONTS.mono}`
  for (let m = 0; m <= TRACK_LENGTH_M; m++) ctx.fillText(String(m), x(m), ground + 44)
  ctx.textAlign = 'right'
  ctx.font = `16px ${NOTEBOOK_FONTS.hand}`
  ctx.fillText('meters', right, ground + 58)
}

export interface TrackFrame {
  state: Body1D
  /** Ticker-tape dots, one every 0.5 s. */
  dots: Body1D[]
  /** Seconds left on the bump wobble after hitting an end stop. */
  bump: number
}

/** The moving parts: ticker-tape dots, the car, and its velocity arrow. */
export function drawTrackFrame(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  frame: TrackFrame,
  width: number,
  height: number,
  colors: NotebookColors,
) {
  const { x, ground, dotsY, wheelRadius: r } = trackLayout(width, height)

  ctx.fillStyle = colors.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `14px ${NOTEBOOK_FONTS.hand}`
  // Label whole seconds, skipping any label that would land on one already drawn (the car
  // doubles back over its own dots when it turns around).
  const labeled: number[] = []
  frame.dots.forEach((d, i) => {
    const px = x(d.x)
    ctx.beginPath()
    ctx.arc(px, dotsY, 3.2, 0, Math.PI * 2)
    ctx.fill()
    if (i % 2 === 0 && labeled.every((l) => Math.abs(l - px) >= LABEL_GAP_PX)) {
      ctx.fillText(`${Math.round(d.t)}s`, px, dotsY - 12)
      labeled.push(px)
    }
  })

  const { state } = frame
  const shake = frame.bump > 0 ? Math.sin(frame.bump * 120) * 2 : 0
  const cx = x(state.x) + shake
  const bodyY = ground - r * 2 - 16
  rc.rectangle(
    cx - 29,
    bodyY,
    58,
    18,
    pen(colors, 21, { fill: colors.carBody, fillStyle: 'hachure', hachureGap: 4, fillWeight: 1 }),
  )
  rc.rectangle(
    cx - 16,
    bodyY - 14,
    26,
    14,
    pen(colors, 22, { fill: colors.carGlass, fillStyle: 'solid' }),
  )
  // Wheels turn with distance traveled, so they roll instead of sliding.
  const spin = (x(state.x) - x(0)) / r
  for (const offset of [-17, 17]) {
    const wx = cx + offset
    const wy = ground - r
    rc.circle(wx, wy, r * 2, pen(colors, 30 + offset, { fill: colors.page, fillStyle: 'solid' }))
    const dx = Math.cos(spin) * r * 0.8
    const dy = Math.sin(spin) * r * 0.8
    rc.line(
      wx - dx,
      wy - dy,
      wx + dx,
      wy + dy,
      pen(colors, 40, { roughness: 0.3, strokeWidth: 1.2 }),
    )
  }

  if (Math.abs(state.v) > 0.05) {
    const ay = bodyY - 26
    const tip = cx + state.v * 18
    const dir = Math.sign(state.v)
    const red = { stroke: colors.redPen, strokeWidth: 2 }
    rc.line(cx, ay, tip, ay, pen(colors, 51, red))
    rc.line(tip, ay, tip - dir * 8, ay - 5, pen(colors, 52, { ...red, roughness: 0.4 }))
    rc.line(tip, ay, tip - dir * 8, ay + 5, pen(colors, 53, { ...red, roughness: 0.4 }))
    ctx.fillStyle = colors.redPen
    ctx.font = `17px ${NOTEBOOK_FONTS.hand}`
    ctx.textAlign = dir > 0 ? 'left' : 'right'
    ctx.fillText(`v = ${state.v.toFixed(1)} m/s`, tip + dir * 8, ay + 5)
  }
}
