export interface Vec2 {
  x: number
  y: number
}

/**
 * The angle at `vertex` between the rays to `a` and `b`, in degrees (0–180).
 * Unsigned, so it doesn't matter that pixel y points down.
 */
export function angleAt(a: Vec2, vertex: Vec2, b: Vec2): number | null {
  const ax = a.x - vertex.x
  const ay = a.y - vertex.y
  const bx = b.x - vertex.x
  const by = b.y - vertex.y
  if ((ax === 0 && ay === 0) || (bx === 0 && by === 0)) return null
  const radians = Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by)
  return (radians * 180) / Math.PI
}
