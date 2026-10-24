'use client'

import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { useProjectSync } from '@/features/projects/hooks/useProjectSync'
import { SignedIn, SignedOut, useIsClerkAvailable } from '@/lib/auth'
import { RedirectToSignIn } from '@clerk/nextjs'

export function ProjectEditor({ projectId }: { projectId: string }) {
  const isClerkAvailable = useIsClerkAvailable()

  return (
    <>
      {isClerkAvailable && (
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      )}
      <SignedIn fallback={!isClerkAvailable ? <LiveWorkspace projectId={projectId} /> : null}>
        <LiveWorkspace projectId={projectId} />
      </SignedIn>
    </>
  )
}

/** Owner project: fetch + hydrate the stores and keep them saved, then render the editor. */
function LiveWorkspace({ projectId }: { projectId: string }) {
  const { saveStatus } = useProjectSync(projectId)
  return <ProjectWorkspace projectId={projectId} saveStatus={saveStatus} />
}
