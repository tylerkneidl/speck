export interface DataPointWithWorld {
  time: number
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
  speed: number
}

export interface Acceleration {
  ax: number
  ay: number
}

export interface RegressionResult {
  slope: number
  intercept: number
  rSquared: number
}

/**
 * Calculate velocity at index using central difference method.
 * Returns null for first and last points (no neighbors on both sides).
 */
export function calculateVelocity(
  data: DataPointWithWorld[],
  index: number
): Velocity | null {
  if (index <= 0 || index >= data.length - 1) {
    return null
  }

  const prev = data[index - 1]
  const next = data[index + 1]
  const dt = next.time - prev.time

  if (dt === 0) return null

  const vx = (next.x - prev.x) / dt
  const vy = (next.y - prev.y) / dt
  const speed = Math.sqrt(vx * vx + vy * vy)

  return { vx, vy, speed }
}

/**
 * Calculate acceleration at index using central difference on velocities.
 * Requires at least 2 points on each side for velocity calculation.
 */
export function calculateAcceleration(
  data: DataPointWithWorld[],
  index: number
): Acceleration | null {
  if (index <= 1 || index >= data.length - 2) {
    return null
  }

  const vPrev = calculateVelocity(data, index - 1)
  const vNext = calculateVelocity(data, index + 1)

  if (!vPrev || !vNext) return null

  const dt = data[index + 1].time - data[index - 1].time
  if (dt === 0) return null

  return {
    ax: (vNext.vx - vPrev.vx) / dt,
    ay: (vNext.vy - vPrev.vy) / dt,
  }
}

/**
 * Perform linear regression on (x, y) points.
 * Returns slope, intercept, and R² correlation coefficient.
 */
export function linearRegression(
  points: Array<{ x: number; y: number }>
): RegressionResult | null {
  const n = points.length
  if (n < 2) return null

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumXX += p.x * p.x
  }

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // Calculate R²
  const meanY = sumY / n
  let ssTot = 0
  let ssRes = 0

  for (const p of points) {
    const predicted = slope * p.x + intercept
    ssTot += (p.y - meanY) ** 2
    ssRes += (p.y - predicted) ** 2
  }

  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}
