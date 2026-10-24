import type { Body1D, Track } from './types'

/** Keeps the body on the track. At either end it stops: clamped in place with zero velocity. */
export function applyTrack(state: Body1D, track: Track): { state: Body1D; hitEnd: boolean } {
  if (state.x < track.min) return { state: { ...state, x: track.min, v: 0 }, hitEnd: true }
  if (state.x > track.max) return { state: { ...state, x: track.max, v: 0 }, hitEnd: true }
  return { state, hitEnd: false }
}
