import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { useSampleProject } from '@/features/projects/hooks/useSampleProject'
import { createFileRoute } from '@tanstack/react-router'

// Public — deliberately NO auth gate. Anyone can explore a real tracked project
// (howitzer cart) end-to-end before signing up.
export const Route = createFileRoute('/try')({
  component: TryPage,
})

function TryPage() {
  useSampleProject()
  return <ProjectWorkspace sample />
}
