import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useCoordinateStore } from '@/stores/coordinates'
import { cn } from '@/lib/utils'

interface SetupGuideProps {
  /** Jump to Track mode from the "Start tracking" CTA. */
  onStartTracking: () => void
}

/**
 * Step-by-step walkthrough of Setup for new projects. Auto-expands until the
 * scale is calibrated (the gate for tracking), then collapses to a "Ready to
 * track" summary. A header chevron re-opens it. Also makes explicit *why* Track
 * is disabled until the scale is set.
 */
export function SetupGuide({ onStartTracking }: SetupGuideProps) {
  const { pixelsPerUnit, originSet } = useCoordinateStore()

  const scaleDone = pixelsPerUnit !== null
  const originDone = originSet

  // Auto-open until calibrated; the header toggle overrides (per project).
  const [override, setOverride] = useState<boolean | null>(null)
  const open = override ?? !scaleDone

  const currentKey = !scaleDone ? 'scale' : !originDone ? 'origin' : null

  const steps = [
    {
      key: 'scale',
      title: 'Set the scale',
      tag: 'required',
      hint: 'Click two points a known distance apart on the video, then type that real distance.',
      done: scaleDone,
    },
    {
      key: 'origin',
      title: 'Place the origin',
      tag: 'recommended',
      hint: 'Click where (0, 0) should be — usually where your object starts.',
      done: originDone,
    },
    {
      key: 'axes',
      title: 'Aim the axes',
      tag: 'optional',
      hint: 'Y is up and level by default — only rotate for a ramp or tilted surface.',
      done: true,
    },
    {
      key: 'fps',
      title: 'Check the frame rate',
      tag: 'optional',
      hint: 'Auto-detected. Adjust only if it doesn’t match your camera (e.g. 240 for slow-mo).',
      done: true,
    },
  ]
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOverride(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">Setup Guide</span>
        <span className={cn('font-mono text-[11px]', scaleDone ? 'text-plasma' : 'text-zinc-600')}>
          {scaleDone ? 'Ready to track' : 'Set the scale to begin'}
        </span>
        {open ? (
          <ChevronUp className="ml-auto h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-zinc-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-800 p-2">
          {steps.map((s, i) => {
            const isCurrent = s.key === currentKey
            return (
              <div key={s.key} className={cn('flex gap-3 rounded-md p-2', isCurrent && 'bg-primary/5')}>
                <div className="mt-0.5 flex-none">
                  {s.done ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-plasma/15 text-plasma">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px]',
                        isCurrent ? 'border-primary text-primary' : 'border-zinc-700 text-zinc-500'
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', s.done ? 'text-zinc-500' : 'text-zinc-200')}>
                      {s.title}
                    </span>
                    {s.tag !== 'required' && (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-600">
                        {s.tag}
                      </span>
                    )}
                  </div>
                  {(isCurrent || s.tag === 'optional') && (
                    <p className={cn('mt-0.5 text-xs leading-relaxed', isCurrent ? 'text-zinc-400' : 'text-zinc-600')}>
                      {s.hint}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {scaleDone && (
            <button
              type="button"
              onClick={onStartTracking}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-flare-hi"
            >
              Start tracking <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
