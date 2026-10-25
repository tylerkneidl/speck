import { describe, expect, it } from 'vitest'
import { graphFrame } from './frames'
import { trackLayout } from './track-drawing'
import { finishedSim } from './useLinearMotion'

describe('finishedSim', () => {
  it('runs to t = 10 s and lands where x0 + v0·t + ½a·t² says', () => {
    const sim = finishedSim({ x0: 1, v0: 2, a: -0.3 })
    expect(sim.state.t).toBeCloseTo(10, 6)
    expect(sim.state.x).toBeCloseTo(1 + 2 * 10 - 0.15 * 100, 6)
    expect(sim.recorder.dots).toHaveLength(21)
  })

  it('stops the car at the end of the track', () => {
    const sim = finishedSim({ x0: 8, v0: 3, a: 0 })
    expect(sim.state.x).toBe(10)
    expect(sim.state.v).toBe(0)
  })
})

describe('graphFrame', () => {
  it('plots one quantity with the cursor at the current state', () => {
    const samples = [
      { t: 0, x: 1, v: 2, a: -0.3 },
      { t: 0.5, x: 1.96, v: 1.85, a: -0.3 },
    ]
    const frame = graphFrame(samples, samples[1]!, 'v')
    expect(frame.samples).toEqual([
      { t: 0, value: 2 },
      { t: 0.5, value: 1.85 },
    ])
    expect(frame.cursor).toEqual({ t: 0.5, value: 1.85 })
  })
})

describe('trackLayout', () => {
  it('spans the 10 m track with 30 px margins', () => {
    const { x } = trackLayout(860, 200)
    expect(x(0)).toBe(30)
    expect(x(10)).toBe(830)
  })
})
