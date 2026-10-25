'use client'

import { advance, createLinearSim, isFinished } from '@/features/sims/engine'
import type { Body1D } from '@/features/sims/engine'
import { NotebookGraph } from '@/features/sims/notebook/NotebookGraph'
import { NOTEBOOK_FONTS, useNotebookColors } from '@/features/sims/notebook/colors'
import type { GraphFrame, GraphSpec } from '@/features/sims/notebook/graph'
import { paperBackground } from '@/features/sims/notebook/paper'
import { useMemo } from 'react'
import { step } from './step'

const GRAPHS: { key: 'x' | 'v' | 'a'; spec: GraphSpec; aria: string }[] = [
  {
    key: 'x',
    spec: { label: 'position  x (m)', tMax: 10, tStep: 2, min: 0, max: 10, step: 2 },
    aria: 'Position versus time',
  },
  {
    key: 'v',
    spec: { label: 'velocity  v (m/s)', tMax: 10, tStep: 2, min: -4, max: 4, step: 2 },
    aria: 'Velocity versus time',
  },
  {
    key: 'a',
    spec: { label: 'acceleration  a (m/s²)', tMax: 10, tStep: 2, min: -2, max: 2, step: 1 },
    aria: 'Acceleration versus time',
  },
]

/** A finished sample run, so the page shows what the sim does before the controls exist. */
function sampleRun(): Body1D[] {
  const a = -0.3
  const sim = createLinearSim({ x0: 1, v0: 2, a0: a, step })
  while (!isFinished(sim)) advance(sim, 1 / 60, a)
  return sim.recorder.samples
}

function frameFor(samples: Body1D[], key: 'x' | 'v' | 'a'): GraphFrame {
  const last = samples.at(-1)
  return {
    samples: samples.map((s) => ({ t: s.t, value: s[key] })),
    cursor: last && { t: last.t, value: last[key] },
  }
}

/**
 * Phase 2 preview of the linear motion notebook: the page, the paper and blueprint palettes, and
 * the three hand-drawn graphs on a sample run. Controls, the track and the modes come in Phase 3.
 */
export function LinearMotionNotebook() {
  const colors = useNotebookColors()
  const samples = useMemo(sampleRun, [])

  return (
    <main className="min-h-screen bg-sunken px-4 py-6 sm:px-6">
      <div
        className="relative mx-auto grid max-w-5xl gap-4 rounded-sm py-6 pr-6 pl-12 shadow-lg sm:pl-16"
        style={{ ...paperBackground(colors), color: colors.ink }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-7 w-0.5 sm:left-11"
          style={{ background: colors.marginRule }}
        />
        <header
          className="flex flex-wrap items-end justify-between gap-2 border-b-2 pb-1.5"
          style={{ borderColor: colors.ink }}
        >
          <h1
            className="text-4xl leading-none font-bold"
            style={{ fontFamily: NOTEBOOK_FONTS.hand }}
          >
            Toy car on a straight track
          </h1>
          <p
            className="text-sm"
            style={{ fontFamily: NOTEBOOK_FONTS.label, color: colors.inkSoft }}
          >
            Unit 1 · Linear motion · preview
          </p>
        </header>
        <p style={{ fontFamily: NOTEBOOK_FONTS.label, color: colors.inkSoft }}>
          Sample run: starts at 1 m moving 2 m/s, with −0.3 m/s² acceleration. Controls come next.
        </p>
        <div className="grid gap-2.5">
          {GRAPHS.map(({ key, spec, aria }) => (
            <NotebookGraph
              key={key}
              spec={spec}
              initialFrame={frameFor(samples, key)}
              className="block h-[170px] w-full"
              ariaLabel={aria}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
