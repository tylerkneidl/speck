import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectEditor,
})

function ProjectEditor() {
  const { projectId } = Route.useParams()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">Edit Project</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Project editor for: {projectId}</p>
      </main>
    </div>
  )
}
