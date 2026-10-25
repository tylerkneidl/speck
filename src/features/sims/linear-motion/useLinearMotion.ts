'use client'

import { type LinearSim, advance, createLinearSim, isFinished } from '@/features/sims/engine'
import type { NotebookGraphHandle } from '@/features/sims/notebook/NotebookGraph'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrackCanvasHandle } from './TrackCanvas'
import { type Quantity, graphFrame } from './frames'
import { step } from './step'
import type { TrackFrame } from './track-drawing'

export interface MotionParams {
  x0: number
  v0: number
  a: number
}

const BUMP_SECONDS = 0.25
const READOUT_EVERY_MS = 100
const STEP_SECONDS = 0.1

function newSim(p: MotionParams) {
  return createLinearSim({ x0: p.x0, v0: p.v0, a0: p.a, step })
}

/** A sim already run to the end, so the page opens showing what the sim does. */
export function finishedSim(p: MotionParams) {
  const sim = newSim(p)
  while (!isFinished(sim)) advance(sim, 1 / 60, p.a)
  return sim
}

export function trackFrame(sim: LinearSim, bump = 0): TrackFrame {
  return { state: sim.state, dots: sim.recorder.dots, bump }
}

/**
 * Runs the linear motion sim. The engine lives in a ref and draws straight to the canvases each
 * animation frame, so React only re-renders for the run state and a throttled readout.
 */
export function useLinearMotion(initial: MotionParams) {
  const [params, setParams] = useState(initial)
  const paramsRef = useRef(params)
  paramsRef.current = params

  const simRef = useRef<LinearSim>(null as unknown as LinearSim)
  if (!simRef.current) simRef.current = finishedSim(initial)

  const [running, setRunning] = useState(false)
  const [readout, setReadout] = useState(simRef.current.state)
  const [finished, setFinished] = useState(true)

  const trackRef = useRef<TrackCanvasHandle>(null)
  const graphRefs = useRef<Partial<Record<Quantity, NotebookGraphHandle | null>>>({})
  const bumpRef = useRef(0)

  const drawAll = useCallback(() => {
    const sim = simRef.current
    trackRef.current?.draw(trackFrame(sim, bumpRef.current))
    for (const key of ['x', 'v', 'a'] as const) {
      graphRefs.current[key]?.draw(graphFrame(sim.recorder.samples, sim.state, key))
    }
  }, [])

  const reset = useCallback(
    (p: MotionParams = paramsRef.current) => {
      simRef.current = newSim(p)
      bumpRef.current = 0
      setRunning(false)
      setFinished(false)
      setReadout(simRef.current.state)
      drawAll()
    },
    [drawAll],
  )

  const update = useCallback(
    (patch: Partial<MotionParams>) => {
      const next = { ...paramsRef.current, ...patch }
      paramsRef.current = next
      setParams(next)
      // Acceleration can change mid-run; anything else starts a fresh run.
      if (!(running && Object.keys(patch).every((k) => k === 'a'))) reset(next)
    },
    [reset, running],
  )

  const toggleRun = useCallback(() => {
    if (running) return setRunning(false)
    if (isFinished(simRef.current)) reset()
    setRunning(true)
  }, [reset, running])

  const stepOnce = useCallback(() => {
    setRunning(false)
    if (isFinished(simRef.current)) reset()
    const sim = simRef.current
    const ticks = Math.round(STEP_SECONDS / sim.clock.dt)
    for (let i = 0; i < ticks && !isFinished(sim); i++)
      advance(sim, sim.clock.dt, paramsRef.current.a)
    setReadout(sim.state)
    setFinished(isFinished(sim))
    drawAll()
  }, [drawAll, reset])

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    let lastReadout = 0
    const loop = (now: number) => {
      const sim = simRef.current
      const dt = (now - last) / 1000
      last = now
      if (advance(sim, dt, paramsRef.current.a).hitEnd) bumpRef.current = BUMP_SECONDS
      bumpRef.current = Math.max(0, bumpRef.current - dt)
      drawAll()
      const done = isFinished(sim)
      if (done || now - lastReadout > READOUT_EVERY_MS) {
        lastReadout = now
        setReadout(sim.state)
      }
      if (done) {
        setRunning(false)
        setFinished(true)
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [running, drawAll])

  return {
    params,
    update,
    running,
    finished,
    readout,
    toggleRun,
    stepOnce,
    reset: () => reset(),
    sim: simRef,
    trackRef,
    graphRefs,
  }
}
