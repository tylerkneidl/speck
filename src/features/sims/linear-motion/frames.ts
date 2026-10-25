import type { Body1D } from '@/features/sims/engine'
import type { GraphFrame } from '@/features/sims/notebook/graph'

export type Quantity = 'x' | 'v' | 'a'

/** One graph's frame from the recorded samples, with the cursor at the current state. */
export function graphFrame(samples: Body1D[], current: Body1D, key: Quantity): GraphFrame {
  return {
    samples: samples.map((s) => ({ t: s.t, value: s[key] })),
    cursor: { t: current.t, value: current[key] },
  }
}
