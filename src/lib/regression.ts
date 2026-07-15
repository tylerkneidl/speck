import { linearRegression } from './kinematics'

/**
 * Curve-fitting models offered on the analysis graphs. Linear and quadratic are
 * the two that map directly onto intro-kinematics motion:
 *   - linear    → constant velocity (x-t) or constant acceleration (v-t)
 *   - quadratic → constant acceleration (x-t):  x = ½at² + v₀t + x₀
 * (Power / exponential / log fits need strictly-positive data, which position
 * and velocity series routinely violate, so they're intentionally left out.)
 */
export type FitModel = 'linear' | 'quadratic'

export const FIT_MODELS: { value: FitModel; label: string; minPoints: number }[] = [
  { value: 'linear', label: 'Linear', minPoints: 2 },
  { value: 'quadratic', label: 'Quadratic', minPoints: 3 },
]

export interface Fit {
  model: FitModel
  /** Coefficients in ascending powers: c[0] + c[1]·x + c[2]·x² … */
  coefficients: number[]
  rSquared: number
  /** Evaluate the fitted curve at x. */
  predict: (x: number) => number
}

export interface Point {
  x: number
  y: number
}

function computeRSquared(points: Point[], predict: (x: number) => number): number {
  const n = points.length
  const meanY = points.reduce((s, p) => s + p.y, 0) / n
  let ssTot = 0
  let ssRes = 0
  for (const p of points) {
    ssTot += (p.y - meanY) ** 2
    ssRes += (p.y - predict(p.x)) ** 2
  }
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot
}

/** Fit the requested model to the points, or null if it can't be solved. */
export function fitCurve(model: FitModel, points: Point[]): Fit | null {
  if (model === 'linear') {
    const lr = linearRegression(points)
    if (!lr) return null
    const predict = (x: number) => lr.intercept + lr.slope * x
    return { model, coefficients: [lr.intercept, lr.slope], rSquared: lr.rSquared, predict }
  }
  return fitQuadratic(points)
}

/**
 * Least-squares degree-2 polynomial (y = c0 + c1·x + c2·x²) via the normal
 * equations, solved with Cramer's rule. Motion data spans a small domain
 * (seconds, metres), so the 3×3 system is well-conditioned in practice.
 */
function fitQuadratic(points: Point[]): Fit | null {
  const n = points.length
  if (n < 3) return null

  let Sx = 0
  let Sxx = 0
  let Sxxx = 0
  let Sxxxx = 0
  let Sy = 0
  let Sxy = 0
  let Sxxy = 0
  for (const { x, y } of points) {
    const x2 = x * x
    Sx += x
    Sxx += x2
    Sxxx += x2 * x
    Sxxxx += x2 * x2
    Sy += y
    Sxy += x * y
    Sxxy += x2 * y
  }

  // [ n    Sx    Sxx  ] [c0]   [Sy  ]
  // [ Sx   Sxx   Sxxx ] [c1] = [Sxy ]
  // [ Sxx  Sxxx  Sxxxx] [c2]   [Sxxy]
  const solution = solve3(
    [
      [n, Sx, Sxx],
      [Sx, Sxx, Sxxx],
      [Sxx, Sxxx, Sxxxx],
    ],
    [Sy, Sxy, Sxxy],
  )
  if (!solution) return null

  const [c0, c1, c2] = solution
  const predict = (x: number) => c0 + c1 * x + c2 * x * x
  return {
    model: 'quadratic',
    coefficients: [c0, c1, c2],
    rSquared: computeRSquared(points, predict),
    predict,
  }
}

function det3(m: number[][]): number {
  return (
    m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
    m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
    m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!)
  )
}

/** Solve a 3×3 system A·x = b via Cramer's rule; null if (near-)singular. */
function solve3(A: number[][], b: number[]): [number, number, number] | null {
  const d = det3(A)
  if (Math.abs(d) < 1e-12) return null
  const withCol = (col: number) => A.map((row, i) => row.map((v, j) => (j === col ? b[i]! : v)))
  return [det3(withCol(0)) / d, det3(withCol(1)) / d, det3(withCol(2)) / d]
}

/** Format a coefficient with sensible precision (physics-report style). */
export function formatCoefficient(v: number): string {
  if (!Number.isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a !== 0 && (a >= 1e4 || a < 1e-3)) return v.toExponential(2)
  if (a >= 100) return v.toFixed(1)
  if (a >= 1) return v.toFixed(2)
  return v.toFixed(3)
}

/** "+ 1.23" / "− 1.23" — a trailing term with its sign split out. */
function signedTerm(v: number): string {
  return `${v >= 0 ? '+' : '−'} ${formatCoefficient(Math.abs(v))}`
}

/**
 * Render the fit as an equation using the given axis variable names. Pass
 * dep='y', indep='x' for the generic math-class form; pass the real axis
 * symbols (e.g. 'x' and 't') for the physics form.
 */
export function formatEquation(fit: Fit, dep: string, indep: string): string {
  const c = fit.coefficients
  if (fit.model === 'linear') {
    // dep = m·indep + b,  coefficients = [b, m]
    return `${dep} = ${formatCoefficient(c[1]!)}${indep} ${signedTerm(c[0]!)}`
  }
  // dep = c2·indep² + c1·indep + c0
  return `${dep} = ${formatCoefficient(c[2]!)}${indep}² ${signedTerm(c[1]!)}${indep} ${signedTerm(c[0]!)}`
}
