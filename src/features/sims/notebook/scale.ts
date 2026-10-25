/** Maps a data range onto a pixel range, and back. */
export interface LinearScale {
  (value: number): number
  invert(pixel: number): number
}

export function linearScale(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number],
): LinearScale {
  const k = (r1 - r0) / (d1 - d0)
  const scale = ((value: number) => r0 + (value - d0) * k) as LinearScale
  scale.invert = (pixel: number) => d0 + (pixel - r0) / k
  return scale
}

/**
 * Tick values from `min` to `max` (inclusive) every `step`. Built by multiplying, not by adding,
 * so floating-point error doesn't pile up or drop the last tick.
 */
export function ticks(min: number, max: number, step: number): number[] {
  const count = Math.floor((max - min) / step + 1e-9)
  return Array.from({ length: count + 1 }, (_, i) => Number((min + i * step).toPrecision(12)))
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
