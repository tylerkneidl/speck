import { describe, it, expect } from 'vitest'
import { calculateVelocity, calculateAcceleration, linearRegression } from './kinematics'

describe('calculateVelocity', () => {
  it('should return null for endpoints', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 1, y: 0 },
      { time: 2, x: 2, y: 0 },
    ]

    expect(calculateVelocity(data, 0)).toBeNull() // first point
    expect(calculateVelocity(data, 2)).toBeNull() // last point
  })

  it('should calculate velocity using central difference', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 1, y: 2 },
      { time: 2, x: 2, y: 4 },
    ]

    const v = calculateVelocity(data, 1)
    expect(v).not.toBeNull()
    expect(v!.vx).toBeCloseTo(1) // (2-0)/(2-0) = 1
    expect(v!.vy).toBeCloseTo(2) // (4-0)/(2-0) = 2
  })

  it('should handle non-uniform time steps', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 0.5, x: 1, y: 1 },
      { time: 2, x: 4, y: 4 },
    ]

    const v = calculateVelocity(data, 1)
    expect(v).not.toBeNull()
    expect(v!.vx).toBeCloseTo(2) // (4-0)/(2-0) = 2
  })
})

describe('calculateAcceleration', () => {
  it('should calculate acceleration from velocities', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 0.5, y: 0 },
      { time: 2, x: 2, y: 0 },
      { time: 3, x: 4.5, y: 0 },
      { time: 4, x: 8, y: 0 },
    ]

    // Velocities: null, 1, 2, 3, null (constant acceleration of 1)
    const a = calculateAcceleration(data, 2)
    expect(a).not.toBeNull()
    expect(a!.ax).toBeCloseTo(1) // (3-1)/(3-1) = 1
  })
})

describe('linearRegression', () => {
  it('should calculate perfect linear fit', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ]

    const result = linearRegression(points)
    expect(result?.slope).toBeCloseTo(2)
    expect(result?.intercept).toBeCloseTo(0)
    expect(result?.rSquared).toBeCloseTo(1)
  })

  it('should calculate y-intercept correctly', () => {
    const points = [
      { x: 0, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 9 },
    ]

    const result = linearRegression(points)
    expect(result?.slope).toBeCloseTo(2)
    expect(result?.intercept).toBeCloseTo(5)
  })

  it('should return null for insufficient data', () => {
    const points = [{ x: 0, y: 0 }]
    expect(linearRegression(points)).toBeNull()
  })
})
