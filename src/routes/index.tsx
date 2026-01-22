import { useState } from 'react'
import { SignInButton, UserButton } from '@clerk/clerk-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, useIsClerkAvailable } from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Folder, Trash2, Loader2, Video, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/')({
  component: HomePage,
})

interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

function HomePage() {
  const isClerkAvailable = useIsClerkAvailable()

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <Video className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="font-mono text-lg font-semibold tracking-tight text-zinc-100">
              Motion Tracker
            </h1>
          </div>
          {isClerkAvailable ? (
            <>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                    },
                  }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-xs text-amber-400">
              Dev Mode
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SignedIn>
          <ProjectList />
        </SignedIn>
        <SignedOut>
          <LandingContent />
        </SignedOut>
      </main>
    </div>
  )
}

function LandingContent() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      {/* Hero section */}
      <div className="relative">
        {/* Decorative grid */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(to right, rgb(39, 39, 42) 1px, transparent 1px),
                                linear-gradient(to bottom, rgb(39, 39, 42) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <h2 className="font-mono text-4xl font-bold tracking-tight text-zinc-100">
          Video-Based Motion Analysis
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Upload videos, track objects frame-by-frame, and generate position, velocity, and
          acceleration data with publication-quality graphs.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <SignInButton mode="modal">
            <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </SignInButton>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Frame-by-Frame', desc: 'Precise point tracking at any frame rate' },
            { title: 'Live Graphs', desc: 'Position, velocity, acceleration plots' },
            { title: 'Linear Regression', desc: 'Best-fit lines with R² analysis' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <h3 className="font-mono text-sm font-medium text-zinc-300">{feature.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectList() {
  const [newProjectName, setNewProjectName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to create project')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setNewProjectName('')
      setIsDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleCreate = () => {
    if (newProjectName.trim()) {
      createMutation.mutate(newProjectName.trim())
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-2xl font-bold tracking-tight text-zinc-100">
            Your Projects
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {projects?.length || 0} {projects?.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Create New Project</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Give your project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400">
                  Project Name
                </Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Ball Drop Experiment"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-zinc-600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!newProjectName.trim() || createMutation.isPending}
                className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project grid or empty state */}
      {projects?.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <Folder className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="mt-4 font-medium text-zinc-400">No projects yet</p>
            <p className="text-sm text-zinc-600">Create your first project to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card
              key={project.id}
              className="group relative border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 text-lg text-zinc-200 group-hover:text-zinc-100">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs text-zinc-600">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Video className="h-3 w-3" />
                    <span>Click to open</span>
                  </div>
                </CardContent>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (confirm('Delete this project? This action cannot be undone.')) {
                    deleteMutation.mutate(project.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
