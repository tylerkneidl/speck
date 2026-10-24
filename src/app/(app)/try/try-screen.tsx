'use client'

import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace'
import { useSampleProject } from '@/features/projects/hooks/useSampleProject'

// Public — deliberately NO auth gate. Anyone can explore a real tracked project
// (howitzer cart) end-to-end before signing up.
export function TryPage() {
  useSampleProject()
  return <ProjectWorkspace sample />
}
