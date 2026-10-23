import type { Lab, LabTake } from '../types'

interface LabPreviewProps {
  lab: Lab
  take: LabTake | null
  /** Bench preview loops the clip; cards show a still first frame. */
  playing?: boolean
}

/** The take's video, or a faint trajectory sketch for a scene we haven't filmed yet. */
export function LabPreview({ lab, take, playing = false }: LabPreviewProps) {
  if (take) {
    return (
      <video
        key={take.id}
        // `#t` makes browsers paint a real first frame instead of black.
        src={playing ? take.video.storageUrl : `${take.video.storageUrl}#t=0.05`}
        className="h-full w-full bg-black object-contain"
        muted
        playsInline
        preload="metadata"
        autoPlay={playing}
        loop={playing}
        aria-label={`${lab.title} video`}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-sunken">
      <svg viewBox="0 0 300 120" className="w-3/4 overflow-visible" aria-hidden="true">
        <path
          d="M 10 110 Q 150 -30 290 110"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray="4 6"
        />
        {[30, 80, 150, 220, 270].map((x) => {
          const t = (x - 10) / 280
          const y = (1 - t) * (1 - t) * 110 + 2 * (1 - t) * t * -30 + t * t * 110
          return (
            <circle key={x} cx={x} cy={y} r={3} fill="hsl(var(--muted-foreground))" opacity=".35" />
          )
        })}
      </svg>
      <span className="absolute left-3 top-3 rounded bg-card/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Filming soon
      </span>
    </div>
  )
}
