import { describe, expect, it } from 'vitest'
import { angleAt } from './geometry'

describe('angleAt', () => {
  const v = { x: 100, y: 100 }

  it('measures a right angle', () => {
    expect(angleAt({ x: 200, y: 100 }, v, { x: 100, y: 0 })).toBeCloseTo(90)
  })

  it('measures a ramp incline: floor, corner, point up the ramp', () => {
    // 30° incline in screen pixels (y down): rise of tan(30°) per unit run.
    const up = { x: 0, y: 100 - 100 * Math.tan(Math.PI / 6) }
    expect(angleAt({ x: 300, y: 100 }, v, up)).toBeCloseTo(150)
    expect(angleAt({ x: 0, y: 100 }, v, up)).toBeCloseTo(30)
  })

  it('is the same whichever side is clicked first', () => {
    const a = { x: 180, y: 40 }
    const b = { x: 30, y: 150 }
    expect(angleAt(a, v, b)).toBeCloseTo(angleAt(b, v, a)!)
  })

  it('handles straight and folded-back rays', () => {
    expect(angleAt({ x: 0, y: 100 }, v, { x: 200, y: 100 })).toBeCloseTo(180)
    expect(angleAt({ x: 150, y: 100 }, v, { x: 200, y: 100 })).toBeCloseTo(0)
  })

  it('returns null when a side has no length', () => {
    expect(angleAt(v, v, { x: 0, y: 0 })).toBeNull()
  })
})
