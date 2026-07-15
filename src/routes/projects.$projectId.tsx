import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { useProjectSync } from '@/features/projects/hooks/useProjectSync'
import { SignedIn, SignedOut, useIsClerkAvailable } from '@/lib/auth'
import { RedirectToSignIn } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectEditor,
})

function ProjectEditor() {
  const isClerkAvailable = useIsClerkAvailable()

  return (
    <>
      {isClerkAvailable && (
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      )}
      <SignedIn fallback={!isClerkAvailable ? <LiveWorkspace /> : null}>
        <LiveWorkspace />
      </SignedIn>
    </>
  )
}

/** Owner project: fetch + hydrate the stores and keep them saved, then render the editor. */
function LiveWorkspace() {
  const { projectId } = Route.useParams()
  const { saveStatus } = useProjectSync(projectId)
  return <ProjectWorkspace projectId={projectId} saveStatus={saveStatus} />
}
