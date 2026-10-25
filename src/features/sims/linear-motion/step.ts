import type { Body1D } from '../engine/types'

/**
 * Linear motion's physics tick. Each sim owns its step and hands it to the engine.
 *
 * One tick for a body on a line: given the state now and the acceleration acting on it,
 * return the state `dt` seconds later. Must not mutate `state`. The returned `a` is the `a` passed in.
 *
 * Uses the kinematic equation. In kinematics a is a given, not the result of forces, so this is
 * exact. Forces, friction, drag and springs get their own stepper later, which computes a from the
 * forces each tick with a numerical method such as velocity Verlet. This one stays the simple one.
 */
export function step(state: Body1D, a: number, dt: number): Body1D {
  return {
    t: state.t + dt,
    x: state.x + state.v * dt + 0.5 * a * dt * dt,
    v: state.v + a * dt,
    a,
  }
}
