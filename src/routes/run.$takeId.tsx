import { findTake } from '@/features/library/catalog'
import { useLibraryTake } from '@/features/library/hooks/useLibraryTake'
import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { Link, createFileRoute } from '@tanstack/react-router'

// Public, like /try: a library take in the workspace with no sign-in and no save.
export const Route = createFileRoute('/run/$takeId')({
  validateSearch: (search: Record<string, unknown>): { calibrated?: boolean } => ({
    calibrated: search.calibrated === true || search.calibrated === 'true' ? true : undefined,
  }),
  component: RunTakePage,
})

function RunTakePage() {
  const { takeId } = Route.useParams()
  const { calibrated = false } = Route.useSearch()
  const found = findTake(takeId)
  const ready = calibrated && !!found?.take.coordinateSystem
  useLibraryTake(found?.take, ready)

  if (!found) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background">
        <h1 className="font-display text-2xl font-bold text-foreground">Video not found</h1>
        <Link to="/library" className="text-sm text-primary underline-offset-4 hover:underline">
          Browse the library
        </Link>
      </div>
    )
  }

  return (
    <ProjectWorkspace
      key={`${takeId}:${ready}`}
      sample
      back={{ to: '/library', label: 'Library' }}
      initialMode={ready ? 'track' : 'setup'}
    />
  )
}
