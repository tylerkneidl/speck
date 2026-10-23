import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  formatSettingValue,
  isValueAvailable,
  randomSelection,
  resolveSelection,
} from '@/features/library/bench'
import { findLab } from '@/features/library/catalog'
import { LabPreview } from '@/features/library/components/LabPreview'
import { LibraryHeader } from '@/features/library/components/LibraryHeader'
import type { Lab, Selection } from '@/features/library/types'
import { cn } from '@/lib/utils'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Check, Link2, Shuffle } from 'lucide-react'
import { useState } from 'react'

// The lab bench: one scene, its filmed variables, and the take they pick.
// The choice lives in the URL, so a teacher can copy the link to hand a whole
// class the same setup.
export const Route = createFileRoute('/library/$labSlug')({
  validateSearch: (search: Record<string, unknown>): Selection =>
    Object.fromEntries(
      Object.entries(search)
        .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
        .map(([k, v]) => [k, String(v)]),
    ),
  component: LabBenchPage,
})

function LabBenchPage() {
  const { labSlug } = Route.useParams()
  const lab = findLab(labSlug)

  if (!lab) {
    return (
      <div className="min-h-screen bg-background">
        <LibraryHeader back={{ to: '/library', label: 'Library' }} />
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Experiment not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been renamed.{' '}
            <Link to="/library" className="text-primary underline-offset-4 hover:underline">
              Browse the library
            </Link>
          </p>
        </main>
      </div>
    )
  }

  return <LabBench lab={lab} />
}

function LabBench({ lab }: { lab: Lab }) {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { selection, take } = resolveSelection(lab, search)
  const [calibrated, setCalibrated] = useState(false)
  const [copied, setCopied] = useState(false)
  const filmed = lab.takes.length > 0

  const choose = (next: Selection) => {
    navigate({ search: resolveSelection(lab, next).selection, replace: true })
  }

  const copyLink = async () => {
    const url = new URL(window.location.href)
    url.search = new URLSearchParams(selection).toString()
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context / permissions) — the URL bar has the same link.
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LibraryHeader back={{ to: '/library', label: 'Library' }} />

      <main className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <div className="aspect-video">
            <LabPreview lab={lab} take={take} playing />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unit {lab.unit} · {lab.topic}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {lab.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lab.summary}</p>

          {lab.settings.length > 0 && (
            <div className="mt-6 space-y-5">
              {lab.settings.map((setting) => (
                <fieldset key={setting.key}>
                  <legend className="mb-2 text-sm font-semibold text-foreground">
                    {setting.label}
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {setting.values.map((raw) => {
                      const value = String(raw)
                      const active = selection[setting.key] === value
                      const available =
                        filmed && isValueAvailable(lab, selection, setting.key, value)
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!available}
                          aria-pressed={active}
                          title={available ? undefined : 'Not filmed yet'}
                          onClick={() => choose({ ...selection, [setting.key]: value })}
                          className={cn(
                            'min-w-12 rounded-md border px-3 py-1.5 font-mono text-sm transition-colors',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:border-input hover:bg-accent',
                            !available &&
                              'cursor-not-allowed border-dashed bg-transparent text-muted-foreground opacity-60 hover:border-border hover:bg-transparent',
                          )}
                        >
                          {formatSettingValue(raw, setting.unit)}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {filmed ? (
            <div className="mt-8 space-y-4">
              {take?.coordinateSystem && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                  <Switch
                    id="calibrated"
                    checked={calibrated}
                    onCheckedChange={setCalibrated}
                    className="mt-0.5"
                  />
                  <Label htmlFor="calibrated" className="cursor-pointer">
                    <span className="block text-sm font-semibold text-foreground">
                      Start calibrated
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      Skip setting the scale and origin, and go straight to tracking.
                    </span>
                  </Label>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {take && (
                  <Button
                    asChild
                    className="gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Link
                      to="/run/$takeId"
                      params={{ takeId: take.id }}
                      search={{ calibrated: calibrated || undefined }}
                    >
                      Start tracking
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {lab.takes.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => choose(randomSelection(lab))}
                    className="gap-2 border-input bg-card text-foreground hover:bg-accent"
                  >
                    <Shuffle className="h-4 w-4" />
                    Surprise me
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={copyLink}
                  className="gap-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {copied ? 'Link copied' : 'Copy link to this setup'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-border bg-sunken p-4">
              <p className="text-sm font-semibold text-foreground">Filming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We're recording this experiment at each of the values above.
              </p>
            </div>
          )}

          {lab.credit && (
            <p className="mt-8 text-xs text-muted-foreground">Footage: {lab.credit}</p>
          )}
        </div>
      </main>
    </div>
  )
}
