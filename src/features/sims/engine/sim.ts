import { type SimClock, createClock, dueTicks } from './clock'
import { type Recorder, createRecorder, record } from './recorder'
import { applyTrack } from './track'
import type { Body1D, StepFn, Track } from './types'

/** A running 1D simulation: the body, its clock and track, and everything recorded so far. */
export interface LinearSim {
  state: Body1D
  clock: SimClock
  track: Track
  tMax: number
  recorder: Recorder
  step: StepFn
}

export interface LinearSimOptions {
  x0: number
  v0: number
  a0?: number
  dt?: number
  track?: Track
  tMax?: number
  /** The sim's own physics tick. The engine runs whatever it is given. */
  step: StepFn
}

export function createLinearSim({
  x0,
  v0,
  a0 = 0,
  dt = 1 / 240,
  track = { min: 0, max: 10 },
  tMax = 10,
  step,
}: LinearSimOptions): LinearSim {
  const sim: LinearSim = {
    state: { t: 0, x: x0, v: v0, a: a0 },
    clock: createClock(dt),
    track,
    tMax,
    recorder: createRecorder(),
    step,
  }
  record(sim.recorder, sim.state)
  return sim
}

export function isFinished(sim: LinearSim): boolean {
  return sim.state.t >= sim.tMax - 1e-9
}

/**
 * Runs the ticks due for `realDt` seconds of wall-clock time under acceleration `a` (held for the
 * whole frame, which is how slider and arrow-key input arrive). Stops at `tMax`.
 */
export function advance(sim: LinearSim, realDt: number, a: number): { hitEnd: boolean } {
  let hitEnd = false
  const ticks = dueTicks(sim.clock, realDt)
  for (let i = 0; i < ticks && !isFinished(sim); i++) {
    const next = applyTrack(sim.step(sim.state, a, sim.clock.dt), sim.track)
    sim.state = next.state
    hitEnd ||= next.hitEnd
    record(sim.recorder, sim.state)
  }
  if (isFinished(sim)) sim.clock.accumulator = 0
  return { hitEnd }
}
