import type { Body1D } from './types'

/**
 * One physics tick for a body on a line: given the state now and the acceleration acting on it,
 * return the state `dt` seconds later. Must not mutate `state`. The returned `a` is the `a` passed in.
 *
 * TODO(Tyler): this is yours to write. The choice is which integrator to use:
 *
 * - Explicit Euler: new x from the old v. Simplest; error grows with dt.
 * - Semi-implicit Euler: new v first, then new x from the new v. Same cost, and it stays stable
 *   for springs and pendulums later, where explicit Euler slowly gains energy.
 * - The kinematic equation x + v·dt + ½a·dt²: exact while a is constant, which is all this sim
 *   needs today. It stops being exact once a depends on v (drag) or on x (springs).
 * - RK4: accurate in every case, but four evaluations per tick and the most code.
 *
 * Friction and drag knobs come next, and later sims reuse this, so think about where a(v) or a(x)
 * would plug in. step.test.ts states the contract; the tolerance there is a judgment call too.
 */
export function step(state: Body1D, a: number, dt: number): Body1D {
  throw new Error(
    `TODO(Tyler): write step() in src/features/sims/engine/step.ts (t=${state.t}, a=${a}, dt=${dt})`,
  )
}
