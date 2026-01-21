import { describe, it, expect } from 'vitest'
import { pixelToWorld, worldToPixel } from './transforms'

describe('pixelToWorld', () => {
  const defaultSystem = {
    origin: { x: 0, y: 0 },
    rotation: 0,
    yAxisUp: true,
    pixelsPerUnit: 100, // 100 pixels = 1 unit
  }

  it('should convert pixel at origin to (0, 0)', () => {
    const result = pixelToWorld({ x: 0, y: 0 }, defaultSystem)
    expect(result?.x).toBeCloseTo(0)
    expect(result?.y).toBeCloseTo(0)
  })

  it('should convert positive x pixel to positive world x', () => {
    const result = pixelToWorld({ x: 100, y: 0 }, defaultSystem)
    expect(result?.x).toBeCloseTo(1) // 100px / 100 = 1 unit
    expect(result?.y).toBeCloseTo(0)
  })

  it('should flip y-axis when yAxisUp is true (physics convention)', () => {
    // In video, y increases downward. With yAxisUp=true,
    // a pixel below origin should have negative world y
    const result = pixelToWorld({ x: 0, y: 100 }, defaultSystem)
    expect(result?.x).toBeCloseTo(0)
    expect(result?.y).toBeCloseTo(-1) // 100px down = -1 unit
  })

  it('should not flip y-axis when yAxisUp is false', () => {
    const system = { ...defaultSystem, yAxisUp: false }
    const result = pixelToWorld({ x: 0, y: 100 }, system)
    expect(result?.x).toBeCloseTo(0)
    expect(result?.y).toBeCloseTo(1) // 100px = 1 unit (same direction)
  })

  it('should handle non-zero origin', () => {
    const system = { ...defaultSystem, origin: { x: 50, y: 50 } }
    const result = pixelToWorld({ x: 150, y: 50 }, system)
    expect(result?.x).toBeCloseTo(1) // (150-50)/100 = 1
    expect(result?.y).toBeCloseTo(0)
  })

  it('should apply rotation (45 degrees)', () => {
    const system = { ...defaultSystem, rotation: 45 }
    // Pixel at (100, 0) with 45 degree rotation
    const result = pixelToWorld({ x: 100, y: 0 }, system)
    // After rotation: x' = 100*cos(45) = 70.7, y' = -100*sin(45) = -70.7
    // After y-flip (yAxisUp=true): y = -(-70.7) = 70.7
    // After scaling: (0.707, 0.707)
    expect(result?.x).toBeCloseTo(Math.sqrt(2) / 2)
    expect(result?.y).toBeCloseTo(Math.sqrt(2) / 2)
  })

  it('should return null for missing pixelsPerUnit', () => {
    const system = { ...defaultSystem, pixelsPerUnit: null }
    const result = pixelToWorld({ x: 100, y: 100 }, system)
    expect(result).toBeNull()
  })
})

describe('worldToPixel', () => {
  const defaultSystem = {
    origin: { x: 0, y: 0 },
    rotation: 0,
    yAxisUp: true,
    pixelsPerUnit: 100,
  }

  it('should be inverse of pixelToWorld', () => {
    const pixel = { x: 150, y: 75 }
    const system = { ...defaultSystem, origin: { x: 50, y: 50 } }

    const world = pixelToWorld(pixel, system)
    expect(world).not.toBeNull()

    const backToPixel = worldToPixel(world!, system)
    expect(backToPixel).not.toBeNull()
    expect(backToPixel!.x).toBeCloseTo(pixel.x)
    expect(backToPixel!.y).toBeCloseTo(pixel.y)
  })
})
