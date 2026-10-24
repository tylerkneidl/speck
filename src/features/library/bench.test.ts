import { describe, expect, it } from 'vitest'
import { isValueAvailable, randomSelection, resolveSelection } from './bench'
import type { Lab, LabTake } from './types'

const video = {
  storageUrl: '/x.mp4',
  fileName: 'x.mp4',
  duration: 1,
  frameRate: 30,
  width: 640,
  height: 480,
  totalFrames: 30,
}

function take(id: string, angle: number, mass: number): LabTake {
  return { id, settingValues: { angle, mass }, video }
}

// 30° was only filmed with no added mass.
const lab: Lab = {
  slug: 'ramp',
  title: 'Ramp',
  summary: '',
  topic: 'Forces',
  unit: 2,
  settings: [
    { key: 'angle', label: 'Angle', unit: '°', values: [10, 20, 30] },
    { key: 'mass', label: 'Mass', unit: 'g', values: [0, 250] },
  ],
  takes: [
    take('a', 10, 0),
    take('b', 10, 250),
    take('c', 20, 0),
    take('d', 20, 250),
    take('e', 30, 0),
  ],
}

describe('isValueAvailable', () => {
  it('greys out combinations that were never filmed', () => {
    expect(isValueAvailable(lab, { angle: '30', mass: '0' }, 'mass', '250')).toBe(false)
    expect(isValueAvailable(lab, { angle: '20', mass: '0' }, 'mass', '250')).toBe(true)
  })

  it('ignores the setting being changed', () => {
    // With +250 g chosen, 10° and 20° are reachable but 30° is not.
    expect(isValueAvailable(lab, { angle: '10', mass: '250' }, 'angle', '20')).toBe(true)
    expect(isValueAvailable(lab, { angle: '10', mass: '250' }, 'angle', '30')).toBe(false)
  })
})

describe('resolveSelection', () => {
  it('returns the matching take for a full, filmed choice', () => {
    expect(resolveSelection(lab, { angle: '20', mass: '250' }).take?.id).toBe('d')
  })

  it('fills in missing settings with the first filmed value', () => {
    const { selection, take } = resolveSelection(lab, {})
    expect(selection).toEqual({ angle: '10', mass: '0' })
    expect(take?.id).toBe('a')
  })

  it('repairs a choice that was never filmed, keeping earlier settings', () => {
    const { selection, take } = resolveSelection(lab, { angle: '30', mass: '250' })
    expect(selection).toEqual({ angle: '30', mass: '0' })
    expect(take?.id).toBe('e')
  })

  it('ignores values that are not settings of this lab', () => {
    expect(resolveSelection(lab, { angle: '99', mass: '0' }).take?.id).toBe('a')
  })

  it('handles labs with no settings and labs with no takes', () => {
    const single: Lab = { ...lab, settings: [], takes: [take('only', 0, 0)] }
    expect(resolveSelection(single, {}).take?.id).toBe('only')
    expect(resolveSelection({ ...lab, takes: [] }, {}).take).toBeNull()
  })
})

describe('randomSelection', () => {
  it('always lands on a filmed take', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      const selection = randomSelection(lab, () => r)
      expect(resolveSelection(lab, selection).selection).toEqual(selection)
    }
  })
})
