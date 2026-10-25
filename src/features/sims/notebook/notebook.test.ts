import { describe, expect, it } from 'vitest'
import { NOTEBOOK_COLORS } from './colors'
import { graphScales } from './graph'
import { clamp, linearScale, ticks } from './scale'

describe('linearScale', () => {
  it('maps a domain onto a range and back', () => {
    const x = linearScale([0, 10], [40, 440])
    expect(x(0)).toBe(40)
    expect(x(10)).toBe(440)
    expect(x(2.5)).toBe(140)
    expect(x.invert(140)).toBeCloseTo(2.5, 12)
  })

  it('handles an inverted range, like a y axis', () => {
    const y = linearScale([-4, 4], [200, 0])
    expect(y(4)).toBe(0)
    expect(y(0)).toBe(100)
    expect(y.invert(50)).toBeCloseTo(2, 12)
  })
})

describe('ticks', () => {
  it('includes both ends', () => {
    expect(ticks(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10])
    expect(ticks(-2, 2, 1)).toEqual([-2, -1, 0, 1, 2])
  })

  it('does not drift or drop the last tick with decimal steps', () => {
    const t = ticks(0, 10, 0.1)
    expect(t).toHaveLength(101)
    expect(t[3]).toBe(0.3)
    expect(t.at(-1)).toBe(10)
  })
})

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(12, 0, 10)).toBe(10)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(4, 0, 10)).toBe(4)
  })
})

describe('graphScales', () => {
  it('puts t = 0 and the lowest value at the bottom-left of the plot area', () => {
    const spec = { label: 'x', tMax: 10, tStep: 2, min: 0, max: 10, step: 2 }
    const { x, y } = graphScales(spec, 500, 170)
    expect(x(0)).toBe(40)
    expect(x(10)).toBe(500 - 44)
    expect(y(0)).toBe(170 - 24)
    expect(y(10)).toBe(26)
  })
})

describe('NOTEBOOK_COLORS', () => {
  it('defines every color in both the paper and blueprint palettes', () => {
    expect(Object.keys(NOTEBOOK_COLORS.dark).sort()).toEqual(
      Object.keys(NOTEBOOK_COLORS.light).sort(),
    )
  })
})
