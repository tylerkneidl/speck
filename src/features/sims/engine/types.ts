/** State of one body moving along a line. SI units: s, m, m/s, m/s². */
export interface Body1D {
  t: number
  x: number
  v: number
  a: number
}

/** One physics tick: the state `dt` seconds after `state`, under acceleration `a`. */
export type StepFn = (state: Body1D, a: number, dt: number) => Body1D

/** The stretch of track the body can move on. Hitting either end stops it dead. */
export interface Track {
  min: number
  max: number
}

/**
 * The one shape sims share with the rest of Speck. A sim run exported as a TimeSeries can go to
 * the data table or regression code without either side importing the other.
 */
export interface TimeSeries {
  t: number[]
  channels: Record<string, { values: number[]; unit: string }>
}
