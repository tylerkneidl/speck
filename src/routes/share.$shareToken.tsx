import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/share/$shareToken')({
  component: SharedProject,
})

function SharedProject() {
  const { shareToken } = Route.useParams()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">Shared Project</h1>
          <span className="ml-2 rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            View Only
          </span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Shared project view: {shareToken}</p>
      </main>
    </div>
  )
}
