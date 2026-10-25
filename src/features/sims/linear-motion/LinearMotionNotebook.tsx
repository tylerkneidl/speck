'use client'

import { NotebookGraph } from '@/features/sims/notebook/NotebookGraph'
import {
  NOTEBOOK_FONTS,
  type NotebookColors,
  useNotebookColors,
} from '@/features/sims/notebook/colors'
import type { GraphSpec } from '@/features/sims/notebook/graph'
import { paperBackground } from '@/features/sims/notebook/paper'
import { type CSSProperties, type ReactNode, useEffect } from 'react'
import { TrackCanvas } from './TrackCanvas'
import { type Quantity, graphFrame } from './frames'
import { type MotionParams, trackFrame, useLinearMotion } from './useLinearMotion'

const GRAPHS: { key: Quantity; spec: GraphSpec; aria: string }[] = [
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

const SLIDERS: {
  key: keyof MotionParams
  label: string
  unit: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'x0', label: 'starting position', unit: 'm', min: 0, max: 10, step: 0.5 },
  { key: 'v0', label: 'initial velocity', unit: 'm/s', min: -4, max: 4, step: 0.5 },
  { key: 'a', label: 'acceleration', unit: 'm/s²', min: -1.5, max: 1.5, step: 0.1 },
]

const START: MotionParams = { x0: 1, v0: 2, a: -0.3 }

/** Linear motion, Explore mode: set x₀, v₀ and a, run the car, and watch x, v and a draw. */
export function LinearMotionNotebook() {
  const colors = useNotebookColors()
  const sim = useLinearMotion(START)
  const { toggleRun } = sim

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (e.code !== 'Space' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      toggleRun()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleRun])

  const hand: CSSProperties = { fontFamily: NOTEBOOK_FONTS.hand }
  const label: CSSProperties = { fontFamily: NOTEBOOK_FONTS.label }

  return (
    <main className="min-h-screen bg-sunken px-4 py-6 sm:px-6">
      <div
        className="relative mx-auto grid max-w-6xl gap-5 rounded-sm py-6 pr-4 pl-10 shadow-lg sm:pr-6 sm:pl-16"
        style={{ ...paperBackground(colors), color: colors.ink }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-6 w-0.5 sm:left-11"
          style={{ background: colors.marginRule }}
        />
        <header
          className="flex flex-wrap items-end justify-between gap-2 border-b-2 pb-1.5"
          style={{ borderColor: colors.ink }}
        >
          <h1 className="text-4xl leading-none font-bold" style={hand}>
            Toy car on a straight track
          </h1>
          <p className="text-sm" style={{ ...label, color: colors.inkSoft }}>
            Unit 1 · Linear motion · Explore
          </p>
        </header>

        <p style={{ ...label, color: colors.inkSoft }}>
          Set the starting values, then press Run. Try changing the acceleration while the car is
          moving.
        </p>

        <TrackCanvas
          ref={sim.trackRef}
          initialFrame={trackFrame(sim.sim.current)}
          className="block h-[200px] w-full"
        />

        <div className="grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <section aria-label="Controls" className="grid gap-4" style={label}>
            {SLIDERS.map((s) => (
              <div key={s.key} className="grid gap-0.5">
                <label
                  htmlFor={`sim-${s.key}`}
                  className="flex items-baseline justify-between text-lg"
                >
                  {s.label}
                  <output htmlFor={`sim-${s.key}`} className="font-mono text-sm tabular-nums">
                    {sim.params[s.key].toFixed(1)} {s.unit}
                  </output>
                </label>
                <input
                  id={`sim-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={sim.params[s.key]}
                  onChange={(e) => sim.update({ [s.key]: Number(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: colors.ink }}
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <PenButton colors={colors} primary onClick={sim.toggleRun}>
                {sim.running ? 'Pause' : sim.finished ? 'Run again' : 'Run'}
              </PenButton>
              <PenButton colors={colors} onClick={sim.stepOnce}>
                Step
              </PenButton>
              <PenButton colors={colors} onClick={sim.reset}>
                Reset
              </PenButton>
            </div>

            <dl
              className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded border-[1.5px] border-dashed px-2.5 py-2"
              style={{ borderColor: colors.inkSoft, background: colors.plotFill }}
            >
              <Reading name="t" value={`${sim.readout.t.toFixed(2)} s`} />
              <Reading name="x" value={`${sim.readout.x.toFixed(2)} m`} />
              <Reading name="v" value={`${sim.readout.v.toFixed(2)} m/s`} />
              <Reading name="a" value={`${sim.readout.a.toFixed(2)} m/s²`} />
            </dl>
          </section>

          <div className="grid min-w-0 gap-2.5">
            {GRAPHS.map(({ key, spec, aria }) => (
              <NotebookGraph
                key={key}
                ref={(handle) => {
                  sim.graphRefs.current[key] = handle
                }}
                spec={spec}
                initialFrame={graphFrame(
                  sim.sim.current.recorder.samples,
                  sim.sim.current.state,
                  key,
                )}
                className="block h-[170px] w-full"
                ariaLabel={aria}
              />
            ))}
          </div>
        </div>

        <footer
          className="flex flex-wrap justify-between gap-2 text-sm"
          style={{ ...label, color: colors.inkSoft }}
        >
          <span>Dots above the track are dropped every 0.5 s, like ticker tape.</span>
          <span>Space runs and pauses.</span>
        </footer>
      </div>
    </main>
  )
}

function Reading({ name, value }: { name: string; value: string }) {
  return (
    <>
      <dt className="text-lg">{name}</dt>
      <dd className="text-right font-mono text-sm tabular-nums">{value}</dd>
    </>
  )
}

/** A button with a hand-drawn, slightly uneven pen outline. */
function PenButton({
  colors,
  primary,
  onClick,
  children,
}: {
  colors: NotebookColors
  primary?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-[1.5px] px-3.5 py-1 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dashed"
      style={{
        borderColor: colors.ink,
        background: primary ? colors.ink : 'transparent',
        color: primary ? colors.page : colors.ink,
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        outlineColor: colors.redPen,
      }}
    >
      {children}
    </button>
  )
}
