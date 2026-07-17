import { cn } from '@/lib/utils'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'
import { ArrowLeft, ArrowRight, Check, Compass, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type PlacementMode = 'scale1' | 'scale2' | 'origin' | null

interface SetupWizardProps {
  /** Route-owned placement flow — the wizard arms it per step; the canvas handles the actual clicks. */
  placementMode: PlacementMode
  setPlacementMode: (mode: PlacementMode) => void
  /** Close for this session (the little ✕). */
  onClose: () => void
  /** Persistently hide ("don't show again"). */
  onDismiss: () => void
  /** Jump into Track mode from the final step. */
  onStartTracking: () => void
}

const STEPS = ['upload', 'scale', 'origin', 'axes', 'fps', 'done'] as const
type StepId = (typeof STEPS)[number]

const CARD_WIDTH = 328

/** Which on-screen element the card points at for a given step (varies within scale/origin). */
function targetFor(step: StepId, hasBothScalePoints: boolean, originSet: boolean): string {
  switch (step) {
    case 'upload':
      return '[data-tour="stage"]'
    case 'scale':
      return hasBothScalePoints ? '[data-tour="scale"]' : '[data-tour="stage"]'
    case 'origin':
      return originSet ? '[data-tour="origin"]' : '[data-tour="stage"]'
    case 'axes':
      return '[data-tour="axes"]'
    case 'fps':
      return '[data-tour="fps"]'
    case 'done':
      return '[data-tour="track-tab"]'
  }
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

interface Anchor {
  left: number
  top: number
  arrowOffset: number
  side: 'up' | 'down' | 'none'
  ready: boolean
  ring: Rect | null
}

/** Which sidebar element the card docks beside for each step. */
function anchorFor(step: StepId): string {
  switch (step) {
    case 'upload':
    case 'scale':
      return '[data-tour="scale"]'
    case 'origin':
      return '[data-tour="origin"]'
    case 'axes':
      return '[data-tour="axes"]'
    case 'fps':
      return '[data-tour="fps"]'
    case 'done':
      return '[data-tour="track-tab"]'
  }
}

/**
 * Docks the card in the sidebar beside the step's controls — never over the
 * video, so it can't hide the object being tracked on any clip. It sits just
 * below its anchor panel (or above, if there's no room) with an arrow pointing
 * at it. The separate `ringSel` element gets the highlight ring, which moves to
 * whatever you should act on (the video while clicking, the panel while typing).
 * Recomputes on step/target change, resize, and scroll.
 */
function useAnchor(
  anchorSel: string,
  ringSel: string,
  cardRef: React.RefObject<HTMLDivElement | null>,
  key: string,
): Anchor {
  const [anchor, setAnchor] = useState<Anchor>({
    left: -9999,
    top: -9999,
    arrowOffset: 0,
    side: 'none',
    ready: false,
    ring: null,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` intentionally forces a re-anchor when the step's sub-state changes; cardRef is a stable ref.
  useLayoutEffect(() => {
    const recompute = () => {
      const anchorEl = document.querySelector(anchorSel) as HTMLElement | null
      const ringEl = document.querySelector(ringSel) as HTMLElement | null
      const stage = document.querySelector('[data-tour="stage"]') as HTMLElement | null
      const card = cardRef.current
      if (!anchorEl || !card) return
      const a = anchorEl.getBoundingClientRect()
      const cw = card.offsetWidth || CARD_WIDTH
      const ch = card.offsetHeight || 168
      const gap = 12
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sidebarLeft = stage ? stage.getBoundingClientRect().right : a.left

      // Keep the card in the sidebar column, aligned under its anchor panel.
      const left = Math.min(Math.max(a.left, sidebarLeft + 8), vw - cw - 8)

      // Below the panel if it fits, else above — so the panel stays visible.
      let top: number
      let side: 'up' | 'down'
      if (a.bottom + gap + ch <= vh - 8) {
        top = a.bottom + gap
        side = 'up'
      } else {
        top = Math.max(8, a.top - gap - ch)
        side = 'down'
      }

      const anchorCenterX = a.left + a.width / 2
      const arrowOffset = Math.max(18, Math.min(anchorCenterX - left, cw - 18))
      const r = ringEl?.getBoundingClientRect()
      setAnchor({
        left,
        top,
        arrowOffset,
        side,
        ready: true,
        ring: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null,
      })
    }

    recompute()
    const anchorEl = document.querySelector(anchorSel) as HTMLElement | null
    const ringEl = document.querySelector(ringSel) as HTMLElement | null
    const ro = new ResizeObserver(recompute)
    if (anchorEl) ro.observe(anchorEl)
    if (ringEl) ro.observe(ringEl)
    if (cardRef.current) ro.observe(cardRef.current)
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [anchorSel, ringSel, key])

  return anchor
}

export function SetupWizard({
  placementMode,
  setPlacementMode,
  onClose,
  onDismiss,
  onStartTracking,
}: SetupWizardProps) {
  const metadata = useVideoStore((s) => s.metadata)
  const scalePoint1 = useCoordinateStore((s) => s.scalePoint1)
  const scalePoint2 = useCoordinateStore((s) => s.scalePoint2)
  const scaleDistance = useCoordinateStore((s) => s.scaleDistance)
  const scaleUnit = useCoordinateStore((s) => s.scaleUnit)
  const pixelsPerUnit = useCoordinateStore((s) => s.pixelsPerUnit)
  const originSet = useCoordinateStore((s) => s.originSet)
  const rotation = useCoordinateStore((s) => s.rotation)
  const resetScale = useCoordinateStore((s) => s.resetScale)
  const resetOrigin = useCoordinateStore((s) => s.resetOrigin)

  // Start on the first step that isn't already done (new projects → upload).
  const [stepIndex, setStepIndex] = useState<number>(() => {
    if (!useVideoStore.getState().metadata) return 0
    const c = useCoordinateStore.getState()
    if (c.pixelsPerUnit === null) return 1
    if (!c.originSet) return 2
    return STEPS.length - 1
  })
  const step = STEPS[stepIndex] ?? 'upload'

  const cardRef = useRef<HTMLDivElement>(null)

  const uploadDone = !!metadata
  const scaleDone = pixelsPerUnit !== null
  const bothScalePoints = !!scalePoint1 && !!scalePoint2

  // Arm placement when entering a step that needs it; clear on leave/unmount so
  // switching steps (or closing) never leaves the canvas in a stray placement mode.
  useEffect(() => {
    const c = useCoordinateStore.getState()
    if (step === 'scale' && c.pixelsPerUnit === null) {
      setPlacementMode(c.scalePoint1 === null ? 'scale1' : c.scalePoint2 === null ? 'scale2' : null)
    } else if (step === 'origin' && !c.originSet) {
      setPlacementMode('origin')
    }
    return () => setPlacementMode(null)
  }, [step, setPlacementMode])

  const goNext = useCallback(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), [])
  const goBack = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), [])

  const ringSel = targetFor(step, bothScalePoints, originSet)
  const anchorSel = anchorFor(step)
  const key = `${step}:${!!scalePoint1}:${!!scalePoint2}:${scaleDone}:${originSet}:${uploadDone}`
  const anchor = useAnchor(anchorSel, ringSel, cardRef, key)

  // Re-arm placement if the user cancelled (Esc) but the step still needs a click.
  const rearmScale = useCallback(() => {
    setPlacementMode(scalePoint1 === null ? 'scale1' : 'scale2')
  }, [scalePoint1, setPlacementMode])

  const pxDist =
    scalePoint1 && scalePoint2
      ? Math.hypot(scalePoint2.x - scalePoint1.x, scalePoint2.y - scalePoint1.y)
      : 0

  return (
    <>
      {/* Highlight ring around the element the guide is pointing at */}
      {anchor.ready && anchor.ring && (
        <div
          aria-hidden
          className="tour-highlight pointer-events-none fixed z-40 rounded-lg"
          style={{
            left: anchor.ring.left - 5,
            top: anchor.ring.top - 5,
            width: anchor.ring.width + 10,
            height: anchor.ring.height + 10,
          }}
        />
      )}

      <div
        ref={cardRef}
        style={{ left: anchor.left, top: anchor.top, width: CARD_WIDTH }}
        className={cn(
          'fixed z-50 rounded-xl border border-primary/50 bg-secondary ring-1 ring-primary/20 transition-[left,top] duration-300 ease-out',
          'shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)]',
          !anchor.ready && 'pointer-events-none opacity-0',
        )}
      >
        {/* Pointer arrow toward the anchored panel */}
        {anchor.side !== 'none' && (
          <span
            aria-hidden
            style={{ left: anchor.arrowOffset }}
            className={cn(
              'absolute h-3 w-3 rotate-45 border-primary/50 bg-secondary',
              anchor.side === 'up' ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-b border-r',
            )}
          />
        )}

        <div className="p-4">
          {/* Header: identity + step count + close */}
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Setup Guide
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {stepIndex + 1} / {STEPS.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="-mr-1 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Close guide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mb-3 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === stepIndex
                    ? 'w-5 bg-primary'
                    : i < stepIndex
                      ? 'w-1.5 bg-plasma'
                      : 'w-1.5 bg-accent',
                )}
              />
            ))}
          </div>

          {/* Step body */}
          <StepBody
            step={step}
            uploadDone={uploadDone}
            fileName={metadata?.fileName}
            dims={metadata ? `${metadata.width}×${metadata.height}` : ''}
            frameRate={metadata?.frameRate ?? 0}
            scalePoint1={!!scalePoint1}
            scalePoint2={!!scalePoint2}
            scaleDone={scaleDone}
            scaleDistance={scaleDistance}
            scaleUnit={scaleUnit}
            pixelsPerUnit={pixelsPerUnit}
            pxDist={pxDist}
            originSet={originSet}
            rotation={rotation}
            placementArmed={placementMode !== null}
            onRearmScale={rearmScale}
            onRearmOrigin={() => setPlacementMode('origin')}
          />

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step === 'scale' && scaleDone && (
                <RedoButton
                  onClick={() => {
                    resetScale()
                    setPlacementMode('scale1')
                  }}
                />
              )}
              {step === 'origin' && originSet && (
                <RedoButton
                  onClick={() => {
                    resetOrigin()
                    setPlacementMode('origin')
                  }}
                />
              )}

              {(step === 'axes' || step === 'fps') && (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Skip
                </button>
              )}

              {step === 'done' ? (
                <button
                  type="button"
                  onClick={onStartTracking}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-flare-hi"
                >
                  Start tracking <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <PrimaryButton
                  step={step}
                  enabled={
                    step === 'upload'
                      ? uploadDone
                      : step === 'scale'
                        ? scaleDone
                        : step === 'origin'
                          ? originSet
                          : true // axes / fps are optional — always continuable
                  }
                  optional={step === 'axes' || step === 'fps'}
                  onClick={goNext}
                />
              )}
            </div>
          </div>

          {/* Don't show again */}
          <button
            type="button"
            onClick={onDismiss}
            className="mt-3 w-full text-center text-[11px] text-muted-foreground transition-colors hover:text-muted-foreground"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </>
  )
}

function PrimaryButton({
  step,
  enabled,
  optional,
  onClick,
}: {
  step: StepId
  enabled: boolean
  optional: boolean
  onClick: () => void
}) {
  // Optional steps show "Skip" until touched — but Continue is always allowed.
  const label = optional ? 'Continue' : step === 'upload' ? 'Next' : 'Continue'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
        enabled
          ? 'bg-primary text-primary-foreground hover:bg-flare-hi'
          : 'cursor-not-allowed bg-secondary text-muted-foreground',
      )}
    >
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}

function RedoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <RotateCcw className="h-3 w-3" /> Redo
    </button>
  )
}

interface StepBodyProps {
  step: StepId
  uploadDone: boolean
  fileName?: string
  dims: string
  frameRate: number
  scalePoint1: boolean
  scalePoint2: boolean
  scaleDone: boolean
  scaleDistance: number | null
  scaleUnit: string
  pixelsPerUnit: number | null
  pxDist: number
  originSet: boolean
  rotation: number
  placementArmed: boolean
  onRearmScale: () => void
  onRearmOrigin: () => void
}

function StepBody(props: StepBodyProps) {
  const { step } = props

  const title = {
    upload: 'Upload a video',
    scale: 'Set the scale',
    origin: 'Place the origin',
    axes: 'Aim the axes',
    fps: 'Frame rate',
    done: "You're all set",
  }[step]

  const tag = step === 'axes' || step === 'fps' ? 'Optional' : null

  return (
    <div>
      <div className="flex items-center gap-2">
        {(step === 'done' ||
          (step === 'upload' && props.uploadDone) ||
          (step === 'scale' && props.scaleDone) ||
          (step === 'origin' && props.originSet)) && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-plasma/15 text-plasma">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {tag && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{tag}</span>
        )}
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        <StepText {...props} />
      </div>
    </div>
  )
}

function StepText(props: StepBodyProps) {
  const {
    step,
    uploadDone,
    fileName,
    dims,
    frameRate,
    scalePoint1,
    scalePoint2,
    scaleDone,
    scaleDistance,
    scaleUnit,
    pixelsPerUnit,
    pxDist,
    originSet,
    rotation,
    placementArmed,
    onRearmScale,
    onRearmOrigin,
  } = props

  if (step === 'upload') {
    return uploadDone ? (
      <>
        Loaded <span className="text-foreground">{fileName}</span> — {dims}, {frameRate} fps.
      </>
    ) : (
      <>
        Drop in an MP4, MOV, or WebM (up to 500&nbsp;MB). We'll read the frame rate automatically.
      </>
    )
  }

  if (step === 'scale') {
    if (scaleDone) {
      return (
        <>
          Scale set:{' '}
          <span className="text-foreground">
            {scaleDistance} {scaleUnit}
          </span>{' '}
          across {Math.round(pxDist)} px ={' '}
          <span className="text-foreground">
            {pixelsPerUnit!.toFixed(1)} px/{scaleUnit}
          </span>
          . Look right?
        </>
      )
    }
    if (!scalePoint1) {
      return (
        <>
          Click one end of something you know the real length of — a meter stick, a doorway, a floor
          tile. {!placementArmed && <RearmLink onClick={onRearmScale} label="Start clicking" />}
        </>
      )
    }
    if (!scalePoint2) {
      return (
        <>
          Now click the <span className="text-foreground">other end</span> of it.{' '}
          {!placementArmed && <RearmLink onClick={onRearmScale} label="Resume" />}
        </>
      )
    }
    return (
      <>
        Nice. Now type the real distance between those points in the panel{' '}
        <span className="text-primary">→</span>
      </>
    )
  }

  if (step === 'origin') {
    if (originSet) {
      return <>Origin placed. Everything gets measured from here. Look right?</>
    }
    return (
      <>
        Click where <span className="text-foreground">(0, 0)</span> should be — usually your object's
        starting position.{' '}
        {!placementArmed && <RearmLink onClick={onRearmOrigin} label="Start clicking" />}
      </>
    )
  }

  if (step === 'axes') {
    return (
      <>
        Y points up and level by default. On a ramp or incline, set the tilt in the panel{' '}
        <span className="text-primary">→</span>. Currently{' '}
        <span className="text-foreground">{rotation}°</span>.
      </>
    )
  }

  if (step === 'fps') {
    return (
      <>
        We detected <span className="text-foreground">{frameRate} fps</span>. Only change it if it
        doesn't match your camera — e.g. 240 for slow-mo.
      </>
    )
  }

  // done
  return <>Your coordinate system is calibrated. Time to track your object, frame by frame.</>
}

function RearmLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="font-medium text-primary hover:underline">
      {label}
    </button>
  )
}
