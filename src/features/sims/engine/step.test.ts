import { describe, expect, it } from 'vitest'
import { step } from './step'
import type { Body1D } from './types'

// The contract for Tyler's step(). These stay red until step() is written.

const DT = 1 / 240

/** Where x0 + v0·t + ½a·t² says the body should be. */
const analytic = (x0: number, v0: number, a: number, t: number) => ({
  x: x0 + v0 * t + 0.5 * a * t * t,
  v: v0 + a * t,
})

function run(start: Body1D, a: number, seconds: number): Body1D {
  let s = start
  const ticks = Math.round(seconds / DT)
  for (let i = 0; i < ticks; i++) s = step(s, a, DT)
  return s
}

/**
 * How far from the textbook answer a 10 s run may drift. 1 cm is about a third of a pixel on the
 * 10 m position graph, so students can never see it. Plain Euler at dt = 1/240 misses by about
 * 3 cm with a = 1.5 m/s², so it fails here unless dt shrinks. If you decide a looser bound is fine,
 * change this and say why.
 */
const POSITION_TOLERANCE_M = 0.01

describe('step', () => {
  it('moves time forward by dt and reports the acceleration it was given', () => {
    const next = step({ t: 2, x: 1, v: 0.5, a: 0 }, -0.3, DT)
    expect(next.t).toBeCloseTo(2 + DT, 12)
    expect(next.a).toBe(-0.3)
  })

  it('does not mutate the state passed in', () => {
    const start = Object.freeze({ t: 0, x: 1, v: 2, a: 0 })
    const next = step(start, 1, DT)
    expect(next).not.toBe(start)
    expect(start).toEqual({ t: 0, x: 1, v: 2, a: 0 })
  })

  it('keeps constant velocity exact', () => {
    const end = run({ t: 0, x: 1, v: 0.75, a: 0 }, 0, 10)
    expect(end.x).toBeCloseTo(1 + 0.75 * 10, 9)
    expect(end.v).toBeCloseTo(0.75, 12)
  })

  it.each([
    { name: 'speeding up from rest', x0: 0, v0: 0, a: 0.2 },
    { name: 'speeding up hard', x0: 0, v0: 0, a: 1.5 },
    { name: 'slowing, turning around', x0: 1, v0: 2, a: -0.3 },
    { name: 'moving left, speeding up', x0: 9, v0: -0.2, a: -0.1 },
  ])('stays within tolerance of x0 + v0·t + ½a·t² over 10 s ($name)', ({ x0, v0, a }) => {
    const end = run({ t: 0, x: x0, v: v0, a }, a, 10)
    const want = analytic(x0, v0, a, 10)
    expect(Math.abs(end.x - want.x)).toBeLessThan(POSITION_TOLERANCE_M)
    expect(end.v).toBeCloseTo(want.v, 6)
  })
})
