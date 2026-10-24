import type { Body1D, TimeSeries } from './types'

const EPS = 1e-9

/** Keeps graph samples and ticker-tape dots on fixed time grids, independent of the tick rate. */
export interface Recorder {
  sampleEvery: number
  dotEvery: number
  samples: Body1D[]
  dots: Body1D[]
}

export function createRecorder(sampleEvery = 1 / 30, dotEvery = 0.5): Recorder {
  return { sampleEvery, dotEvery, samples: [], dots: [] }
}

/** Records `state` if it has reached the next sample or dot time. Call once per tick and at t = 0. */
export function record(rec: Recorder, state: Body1D): void {
  if (state.t >= rec.samples.length * rec.sampleEvery - EPS) rec.samples.push({ ...state })
  if (state.t >= rec.dots.length * rec.dotEvery - EPS) rec.dots.push({ ...state })
}

export function toTimeSeries(samples: Body1D[]): TimeSeries {
  return {
    t: samples.map((s) => s.t),
    channels: {
      x: { values: samples.map((s) => s.x), unit: 'm' },
      v: { values: samples.map((s) => s.v), unit: 'm/s' },
      a: { values: samples.map((s) => s.a), unit: 'm/s²' },
    },
  }
}
