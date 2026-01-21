import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Motion Tracker</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <SignedIn>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <p className="mt-2 text-muted-foreground">Project list will go here</p>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Video-Based Motion Analysis</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to start analyzing motion in your videos
            </p>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}
