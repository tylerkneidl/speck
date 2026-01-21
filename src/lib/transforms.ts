import type { Point } from '@/stores/coordinates'

export interface CoordinateSystem {
  origin: Point
  rotation: number
  yAxisUp: boolean
  pixelsPerUnit: number | null
}

export function pixelToWorld(pixel: Point, system: CoordinateSystem): Point | null {
  const { origin, rotation, yAxisUp, pixelsPerUnit } = system

  if (pixelsPerUnit === null || pixelsPerUnit === 0) {
    return null
  }

  // Step 1: Translate to origin
  const translated = {
    x: pixel.x - origin.x,
    y: pixel.y - origin.y,
  }

  // Step 2: Apply rotation (convert degrees to radians)
  const theta = (rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const rotated = {
    x: translated.x * cos + translated.y * sin,
    y: -translated.x * sin + translated.y * cos,
  }

  // Step 3: Apply Y-axis direction
  const yAdjusted = {
    x: rotated.x,
    y: yAxisUp ? -rotated.y : rotated.y,
  }

  // Step 4: Convert to world units
  return {
    x: yAdjusted.x / pixelsPerUnit,
    y: yAdjusted.y / pixelsPerUnit,
  }
}

export function worldToPixel(world: Point, system: CoordinateSystem): Point | null {
  const { origin, rotation, yAxisUp, pixelsPerUnit } = system

  if (pixelsPerUnit === null || pixelsPerUnit === 0) {
    return null
  }

  // Reverse step 4: Convert from world units
  const scaled = {
    x: world.x * pixelsPerUnit,
    y: world.y * pixelsPerUnit,
  }

  // Reverse step 3: Apply Y-axis direction
  const yAdjusted = {
    x: scaled.x,
    y: yAxisUp ? -scaled.y : scaled.y,
  }

  // Reverse step 2: Reverse rotation
  const theta = (rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const rotated = {
    x: yAdjusted.x * cos - yAdjusted.y * sin,
    y: yAdjusted.x * sin + yAdjusted.y * cos,
  }

  // Reverse step 1: Translate from origin
  return {
    x: rotated.x + origin.x,
    y: rotated.y + origin.y,
  }
}
