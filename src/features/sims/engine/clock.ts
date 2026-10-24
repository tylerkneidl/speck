/** Real time beyond this per frame is dropped, so a backgrounded tab doesn't replay minutes of physics. */
export const MAX_FRAME_SECONDS = 0.25

/** Fixed-timestep clock: turns uneven frame times into whole physics ticks of `dt`. */
export interface SimClock {
  dt: number
  accumulator: number
}

export function createClock(dt: number): SimClock {
  return { dt, accumulator: 0 }
}

/** Adds a frame's real time and returns how many whole ticks are due. The remainder carries over. */
export function dueTicks(clock: SimClock, realDt: number): number {
  clock.accumulator += Math.min(Math.max(realDt, 0), MAX_FRAME_SECONDS)
  const ticks = Math.floor(clock.accumulator / clock.dt + 1e-9)
  clock.accumulator = Math.max(0, clock.accumulator - ticks * clock.dt)
  return ticks
}
