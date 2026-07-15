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
import { useApiClient } from '@/lib/api'
import { SignedIn, SignedOut, useIsClerkAvailable } from '@/lib/auth'
import { SignInButton, UserButton } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Loader2, Plus, Trash2, Video } from 'lucide-react'
import { useState } from 'react'

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
            <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="23" cy="8" r="5" fill="#ff4e22" />
              <circle cx="14" cy="14" r="3.1" fill="#ff4e22" opacity=".6" />
              <circle cx="7.5" cy="19" r="2.1" fill="#ff4e22" opacity=".33" />
              <circle cx="3" cy="23.5" r="1.4" fill="#ff4e22" opacity=".18" />
            </svg>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-zinc-100">
              Speck<span className="text-primary">.</span>
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

        <svg
          viewBox="0 0 600 220"
          className="mx-auto mb-2 w-full max-w-xl overflow-visible"
          aria-hidden="true"
        >
          <path className="speck-traj-line" d="M 10 210 Q 300 -50 590 210" />
          <circle cx="10" cy="210" r="3" fill="#ff4e22" opacity=".14" />
          <circle cx="68" cy="162" r="3.4" fill="#ff4e22" opacity=".22" />
          <circle cx="126" cy="122" r="3.8" fill="#ff4e22" opacity=".3" />
          <circle cx="184" cy="92" r="4.2" fill="#ff4e22" opacity=".4" />
          <circle cx="242" cy="72" r="4.6" fill="#ff4e22" opacity=".52" />
          <circle cx="300" cy="62" r="5" fill="#ff4e22" opacity=".64" />
          <circle cx="358" cy="72" r="4.6" fill="#ff4e22" opacity=".52" />
          <circle cx="416" cy="92" r="4.2" fill="#ff4e22" opacity=".4" />
          <circle cx="474" cy="122" r="3.8" fill="#ff4e22" opacity=".3" />
          <circle cx="532" cy="162" r="3.4" fill="#ff4e22" opacity=".22" />
          <circle cx="590" cy="210" r="3" fill="#ff4e22" opacity=".14" />
          <circle className="speck-live" r="6" />
        </svg>

        <h2 className="font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-zinc-100 sm:text-6xl">
          See it.
          <br />
          Track it.
          <br />
          <span className="speck-cycle" aria-hidden="true">
            <span className="speck-words">
              <span>Solve&nbsp;it.</span>
              <span>Graph&nbsp;it.</span>
              <span>Learn&nbsp;it.</span>
              <span>Prove&nbsp;it.</span>
              <span>Solve&nbsp;it.</span>
            </span>
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
          Turn any video into position, velocity, and acceleration data &mdash; one tracked point at
          a time. Built for the physics classroom, fast enough to feel like play.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <SignInButton mode="modal">
            <Button className="gap-2 bg-emerald-600 font-semibold text-zinc-950 hover:bg-emerald-500">
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </Button>
          </SignInButton>
          <Button
            asChild
            variant="outline"
            className="gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Link to="/try">
              Try a sample — no sign-in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
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
              <h3 className="font-display text-sm font-bold text-zinc-100">{feature.title}</h3>
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
  const api = useApiClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api('/api/projects', {
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
      const res = await api(`/api/projects/${id}`, { method: 'DELETE' })
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
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
            Your Projects
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {projects?.length || 0} {projects?.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 font-semibold text-zinc-950 hover:bg-emerald-500">
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
                className="bg-emerald-600 font-semibold text-zinc-950 hover:bg-emerald-500 disabled:opacity-50"
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
            <svg viewBox="0 0 600 220" className="w-56 overflow-visible" aria-hidden="true">
              <path className="speck-traj-line" d="M 10 210 Q 300 -50 590 210" />
              <circle cx="126" cy="122" r="4" fill="#ff4e22" opacity=".3" />
              <circle cx="242" cy="72" r="4.6" fill="#ff4e22" opacity=".5" />
              <circle cx="300" cy="62" r="5" fill="#ff4e22" opacity=".64" />
              <circle cx="416" cy="92" r="4.2" fill="#ff4e22" opacity=".4" />
              <circle cx="532" cy="162" r="3.4" fill="#ff4e22" opacity=".22" />
            </svg>
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
