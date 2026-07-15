import type { DataPoint } from '@/stores/tracking'
import { describe, expect, it } from 'vitest'
import { diffPoints, pointPosKey } from './useProjectSync'

function pt(id: string, frameNumber: number, pixelX: number, pixelY: number): DataPoint {
  return { id, frameNumber, time: frameNumber / 30, pixelX, pixelY }
}

/** Build the saved map the way hydrate/sync do. */
function savedFrom(points: DataPoint[]): Map<string, string> {
  return new Map(points.map((p) => [p.id, pointPosKey(p)]))
}

describe('pointPosKey', () => {
  it('changes when the position changes, stable otherwise', () => {
    const a = pt('1', 0, 100, 200)
    expect(pointPosKey(a)).toBe(pointPosKey(pt('anything', 0, 100, 200)))
    expect(pointPosKey(a)).not.toBe(pointPosKey(pt('1', 0, 101, 200)))
    expect(pointPosKey(a)).not.toBe(pointPosKey(pt('1', 1, 100, 200)))
  })
})

describe('diffPoints', () => {
  it('flags a brand-new point for upsert', () => {
    const saved = savedFrom([])
    const { toUpsert, toDelete } = diffPoints([pt('1', 0, 10, 20)], saved)
    expect(toUpsert.map((p) => p.id)).toEqual(['1'])
    expect(toDelete).toEqual([])
  })

  it('flags a moved point for upsert (the drag case)', () => {
    const original = pt('1', 0, 10, 20)
    const saved = savedFrom([original])
    const moved = pt('1', 0, 55, 60)
    const { toUpsert, toDelete } = diffPoints([moved], saved)
    expect(toUpsert.map((p) => p.id)).toEqual(['1'])
    expect(toDelete).toEqual([])
  })

  it('ignores an unchanged point', () => {
    const p = pt('1', 0, 10, 20)
    const saved = savedFrom([p])
    const { toUpsert, toDelete } = diffPoints([pt('1', 0, 10, 20)], saved)
    expect(toUpsert).toEqual([])
    expect(toDelete).toEqual([])
  })

  it('flags a removed point for delete', () => {
    const saved = savedFrom([pt('1', 0, 10, 20), pt('2', 1, 30, 40)])
    const { toUpsert, toDelete } = diffPoints([pt('1', 0, 10, 20)], saved)
    expect(toUpsert).toEqual([])
    expect(toDelete).toEqual(['2'])
  })

  it('handles a mix of add, move, keep, and delete in one pass', () => {
    const saved = savedFrom([pt('keep', 0, 1, 1), pt('move', 1, 2, 2), pt('gone', 2, 3, 3)])
    const current = [pt('keep', 0, 1, 1), pt('move', 1, 9, 9), pt('new', 3, 4, 4)]
    const { toUpsert, toDelete } = diffPoints(current, saved)
    expect(toUpsert.map((p) => p.id).sort()).toEqual(['move', 'new'])
    expect(toDelete).toEqual(['gone'])
  })
})
