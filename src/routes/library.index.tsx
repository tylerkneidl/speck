import { Input } from '@/components/ui/input'
import { LIBRARY } from '@/features/library/catalog'
import { LabPreview } from '@/features/library/components/LabPreview'
import { LibraryHeader } from '@/features/library/components/LibraryHeader'
import type { Lab, LabTopic } from '@/features/library/types'
import { cn } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

// Public — anyone can browse the library and run a take with no sign-in.
export const Route = createFileRoute('/library/')({
  component: LibraryPage,
})

const TOPICS: LabTopic[] = [
  'Kinematics',
  'Forces',
  'Energy',
  'Momentum',
  'Rotation',
  'Oscillations',
  'Fluids',
]

function LibraryPage() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<LabTopic | null>(null)

  const presentTopics = TOPICS.filter((t) => LIBRARY.some((lab) => lab.topic === t))

  const labs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LIBRARY.filter((lab) => !topic || lab.topic === topic)
      .filter(
        (lab) =>
          !q ||
          lab.title.toLowerCase().includes(q) ||
          lab.summary.toLowerCase().includes(q) ||
          lab.settings.some((s) => s.label.toLowerCase().includes(q)),
      )
      .sort((a, b) => Number(b.takes.length > 0) - Number(a.takes.length > 0) || a.unit - b.unit)
  }, [query, topic])

  return (
    <div className="min-h-screen bg-background">
      <LibraryHeader back={{ to: '/', label: 'Home' }} />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Lab library
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Real experiments, filmed for tracking. Pick a scene, set its variables, and start
            measuring.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search experiments"
              aria-label="Search experiments"
              className="border-input bg-card pl-9 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">Filter by topic</legend>
            <TopicChip active={topic === null} onClick={() => setTopic(null)}>
              All
            </TopicChip>
            {presentTopics.map((t) => (
              <TopicChip key={t} active={topic === t} onClick={() => setTopic(t)}>
                {t}
              </TopicChip>
            ))}
          </fieldset>
        </div>

        {labs.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No experiments match “{query}”.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <LabCard key={lab.slug} lab={lab} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TopicChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function LabCard({ lab }: { lab: Lab }) {
  const filmed = lab.takes.length > 0
  return (
    <Link
      to="/library/$labSlug"
      params={{ labSlug: lab.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-input"
    >
      <div className={cn('aspect-video overflow-hidden', !filmed && 'opacity-90')}>
        <LabPreview lab={lab} take={lab.takes[0] ?? null} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Unit {lab.unit} · {lab.topic}
        </p>
        <h2 className="mt-1 font-display text-lg font-bold text-foreground group-hover:text-primary">
          {lab.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{lab.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {lab.settings.length === 0
              ? 'Single scene'
              : lab.settings.map((s) => s.label).join(', ')}
          </span>
          {filmed && (
            <span>
              <span className="font-mono">{lab.takes.length}</span>{' '}
              {lab.takes.length === 1 ? 'video' : 'videos'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
