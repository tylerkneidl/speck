import { describe, expect, it } from 'vitest'
import { type Point, fitCurve, formatCoefficient, formatEquation } from './regression'

describe('fitCurve — linear', () => {
  it('recovers a perfect line (y = 2x + 1)', () => {
    const pts: Point[] = [0, 1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 1 }))
    const fit = fitCurve('linear', pts)!
    expect(fit).not.toBeNull()
    expect(fit.coefficients[0]).toBeCloseTo(1, 6) // intercept
    expect(fit.coefficients[1]).toBeCloseTo(2, 6) // slope
    expect(fit.rSquared).toBeCloseTo(1, 6)
    expect(fit.predict(10)).toBeCloseTo(21, 6)
  })

  it('returns null with fewer than 2 points', () => {
    expect(fitCurve('linear', [{ x: 1, y: 1 }])).toBeNull()
  })
})

describe('fitCurve — quadratic', () => {
  it('recovers a perfect parabola (y = 3x² − 2x + 5)', () => {
    const f = (x: number) => 3 * x * x - 2 * x + 5
    const pts: Point[] = [-2, -1, 0, 1, 2, 3].map((x) => ({ x, y: f(x) }))
    const fit = fitCurve('quadratic', pts)!
    expect(fit).not.toBeNull()
    expect(fit.coefficients[0]).toBeCloseTo(5, 4) // c0
    expect(fit.coefficients[1]).toBeCloseTo(-2, 4) // c1
    expect(fit.coefficients[2]).toBeCloseTo(3, 4) // c2
    expect(fit.rSquared).toBeCloseTo(1, 6)
    expect(fit.predict(4)).toBeCloseTo(f(4), 4)
  })

  it('models constant acceleration (free fall: y = ½·9.8·t²)', () => {
    // x = ½at² with a = 9.8 → coefficient of t² should be 4.9
    const pts: Point[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t) => ({ x: t, y: 4.9 * t * t }))
    const fit = fitCurve('quadratic', pts)!
    expect(fit.coefficients[2]).toBeCloseTo(4.9, 4)
    // acceleration = 2 × quadratic coefficient
    expect(2 * fit.coefficients[2]!).toBeCloseTo(9.8, 4)
  })

  it('returns null with fewer than 3 points', () => {
    expect(
      fitCurve('quadratic', [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toBeNull()
  })

  it('fits noisy data with high but imperfect R²', () => {
    const pts: Point[] = [0, 1, 2, 3, 4, 5].map((x) => ({
      x,
      y: x * x + (x % 2 === 0 ? 0.3 : -0.3),
    }))
    const fit = fitCurve('quadratic', pts)!
    expect(fit.rSquared).toBeGreaterThan(0.98)
    expect(fit.rSquared).toBeLessThan(1)
  })
})

describe('formatCoefficient', () => {
  it('scales precision to magnitude', () => {
    expect(formatCoefficient(0.12345)).toBe('0.123')
    expect(formatCoefficient(2.3456)).toBe('2.35')
    expect(formatCoefficient(123.456)).toBe('123.5')
  })

  it('uses exponential for very large / small values', () => {
    expect(formatCoefficient(0.0001)).toContain('e')
    expect(formatCoefficient(50000)).toContain('e')
  })
})

describe('formatEquation', () => {
  it('renders a linear fit in physics axis variables', () => {
    const fit = fitCurve(
      'linear',
      [0, 1, 2].map((x) => ({ x, y: 2 * x + 1 })),
    )!
    expect(formatEquation(fit, 'x', 't')).toBe('x = 2.00t + 1.00')
  })

  it('renders the generic math-class form', () => {
    const fit = fitCurve(
      'linear',
      [0, 1, 2].map((x) => ({ x, y: 2 * x - 1 })),
    )!
    expect(formatEquation(fit, 'y', 'x')).toBe('y = 2.00x − 1.00')
  })

  it('renders a quadratic fit with a negative middle term', () => {
    const fit = fitCurve(
      'quadratic',
      [-1, 0, 1, 2].map((x) => ({ x, y: 3 * x * x - 2 * x + 5 })),
    )!
    expect(formatEquation(fit, 'x', 't')).toBe('x = 3.00t² − 2.00t + 5.00')
  })
})
