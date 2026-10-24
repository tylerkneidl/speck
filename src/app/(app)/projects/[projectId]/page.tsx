import { ProjectEditorClient } from './client'

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <ProjectEditorClient projectId={projectId} />
}
