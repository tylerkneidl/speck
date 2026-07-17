import { Button } from '@/components/ui/button'
import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { useSharedProject } from '@/features/projects/hooks/useSharedProject'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Link2, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/share/$shareToken')({
  component: SharedProject,
})

/**
 * Public read-only view of a shared project. No auth — the token in the URL is
 * the credential, and the server only serves projects still flagged public.
 */
function SharedProject() {
  const { shareToken } = Route.useParams()
  const { isLoading, isError } = useSharedProject(shareToken)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return <InvalidLink />
  }

  return <ProjectWorkspace readOnly />
}

/** Same message whether the token is wrong or sharing was turned off. */
function InvalidLink() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
        <Link2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
        This link isn't available
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be mistyped, or the owner may have stopped sharing this project.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button asChild size="sm" className="gap-1.5 font-semibold">
          <Link to="/try">
            Try Speck with a sample
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
