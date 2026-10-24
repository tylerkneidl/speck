import { describe, expect, it } from 'vitest'
import { MAX_FRAME_SECONDS, createClock, dueTicks } from './clock'
import { createRecorder, record, toTimeSeries } from './recorder'
import { advance, createLinearSim, isFinished } from './sim'
import { applyTrack } from './track'
import type { StepFn } from './types'

// A stand-in for Tyler's step(), so the engine is tested on its own. It ignores acceleration,
// which keeps it from hinting at an integrator.
const drift: StepFn = (s, a, dt) => ({ t: s.t + dt, x: s.x + s.v * dt, v: s.v, a })

describe('dueTicks', () => {
  it('returns whole ticks and carries the remainder', () => {
    const clock = createClock(0.01)
    expect(dueTicks(clock, 0.025)).toBe(2)
    expect(clock.accumulator).toBeCloseTo(0.005, 12)
    expect(dueTicks(clock, 0.005)).toBe(1)
    expect(clock.accumulator).toBeCloseTo(0, 12)
  })

  it('caps a long frame so a background tab does not replay minutes of physics', () => {
    const clock = createClock(0.01)
    expect(dueTicks(clock, 30)).toBe(Math.round(MAX_FRAME_SECONDS / 0.01))
  })

  it('ignores negative frame times', () => {
    expect(dueTicks(createClock(0.01), -1)).toBe(0)
  })
})

describe('applyTrack', () => {
  const track = { min: 0, max: 10 }

  it('leaves a body on the track alone', () => {
    const s = { t: 1, x: 5, v: 2, a: 0 }
    expect(applyTrack(s, track)).toEqual({ state: s, hitEnd: false })
  })

  it('stops a body at either end', () => {
    expect(applyTrack({ t: 1, x: 10.2, v: 3, a: 1 }, track)).toEqual({
      state: { t: 1, x: 10, v: 0, a: 1 },
      hitEnd: true,
    })
    expect(applyTrack({ t: 1, x: -0.1, v: -3, a: 0 }, track).state).toMatchObject({ x: 0, v: 0 })
  })
})

describe('recorder', () => {
  it('samples on a fixed grid regardless of tick rate', () => {
    for (const dt of [1 / 240, 1 / 100, 1 / 60]) {
      const rec = createRecorder(0.1, 0.5)
      for (let i = 0; i * dt <= 1 + 1e-9; i++) record(rec, { t: i * dt, x: 0, v: 0, a: 0 })
      expect(rec.samples).toHaveLength(11)
      expect(rec.dots).toHaveLength(3)
    }
  })

  it('exports a TimeSeries with units', () => {
    const series = toTimeSeries([
      { t: 0, x: 1, v: 2, a: 0.5 },
      { t: 0.1, x: 1.2, v: 2.05, a: 0.5 },
    ])
    expect(series.t).toEqual([0, 0.1])
    expect(series.channels.x).toEqual({ values: [1, 1.2], unit: 'm' })
    expect(series.channels.v?.unit).toBe('m/s')
    expect(series.channels.a?.values).toEqual([0.5, 0.5])
  })
})

describe('advance', () => {
  it('records the starting state', () => {
    const sim = createLinearSim({ x0: 2, v0: 1, step: drift })
    expect(sim.recorder.samples[0]).toEqual({ t: 0, x: 2, v: 1, a: 0 })
    expect(sim.recorder.dots).toHaveLength(1)
  })

  it('lands in the same place whatever the frame rate', () => {
    const finalX = (fps: number) => {
      const sim = createLinearSim({ x0: 1, v0: 0.5, step: drift })
      for (let f = 0; f < fps * 4; f++) advance(sim, 1 / fps, 0)
      return sim.state
    }
    const at60 = finalX(60)
    const at144 = finalX(144)
    expect(at144.t).toBeCloseTo(at60.t, 9)
    expect(at144.x).toBeCloseTo(at60.x, 9)
  })

  it('stops at tMax and stays there', () => {
    const sim = createLinearSim({ x0: 0, v0: 0.5, tMax: 2, step: drift })
    for (let f = 0; f < 600; f++) advance(sim, 1 / 60, 0)
    expect(isFinished(sim)).toBe(true)
    expect(sim.state.t).toBeCloseTo(2, 9)
    expect(sim.recorder.samples.at(-1)?.t).toBeCloseTo(2, 6)
  })

  it('passes the frame acceleration to step', () => {
    const seen: number[] = []
    const spy: StepFn = (s, a, dt) => {
      seen.push(a)
      return drift(s, a, dt)
    }
    const sim = createLinearSim({ x0: 5, v0: 0, step: spy })
    advance(sim, 0.05, 1.5)
    advance(sim, 0.05, -1.5)
    expect(seen.length).toBeGreaterThan(0)
    expect(new Set(seen)).toEqual(new Set([1.5, -1.5]))
  })

  it('reports hitting the end of the track and stops the car there', () => {
    const sim = createLinearSim({ x0: 9.9, v0: 2, step: drift })
    const { hitEnd } = advance(sim, 0.2, 0)
    expect(hitEnd).toBe(true)
    expect(sim.state).toMatchObject({ x: 10, v: 0 })
  })
})
