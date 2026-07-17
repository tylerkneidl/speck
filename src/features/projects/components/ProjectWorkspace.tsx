import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronLeft,
  Compass,
  Crosshair,
  LineChart,
  Loader2,
  Redo2,
  RefreshCw,
  Settings,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import {
  AxisRotation,
  OriginTool,
  ScaleCalibration,
  SetupWizard,
} from '@/features/coordinates/components'
import { DataTable } from '@/features/data-table/components'
import { Graph, type GraphType } from '@/features/graphing/components'
import { ShareButton } from '@/features/projects/components/ShareButton'
import type { SaveStatus } from '@/features/projects/hooks/useProjectSync'
import { CanvasOverlay } from '@/features/tracking/components'
import {
  FrameRateControl,
  VideoControls,
  VideoPlayer,
  VideoUpload,
} from '@/features/video/components'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCoordinateStore } from '@/stores/coordinates'
import { useTrackingStore } from '@/stores/tracking'
import { useUiStore } from '@/stores/ui'
import { useVideoStore } from '@/stores/video'

type Mode = 'setup' | 'track' | 'analyze'
type PlacementMode = 'scale1' | 'scale2' | 'origin' | null

interface ProjectWorkspaceProps {
  /** Owner project id — enables uploads and drives the live save path. Omitted for the sample. */
  projectId?: string
  /** Live save state (from useProjectSync). Ignored in sample mode. */
  saveStatus?: SaveStatus
  /** Read-anywhere sample: no upload, no save, no auto-guide — just explore + a "make your own" CTA. */
  sample?: boolean
  /**
   * Public shared view (/share/:token): everything renders and every mode is
   * explorable, but nothing can be edited — no point add/drag, no upload, no
   * guide, no undo. The viewer isn't the owner and there's nothing to save to.
   */
  readOnly?: boolean
}

/**
 * The editor surface — video + canvas, coordinate/track/analyze panels, the
 * guided setup overlay. Reads everything from the Zustand stores, so it doesn't
 * care whether the data came from the server (owner project) or the bundled
 * sample; the parent route loads the stores and passes `sample` / `saveStatus`.
 */
export function ProjectWorkspace({
  projectId,
  saveStatus = 'idle',
  sample = false,
  readOnly = false,
}: ProjectWorkspaceProps) {
  const [mode, setMode] = useState<Mode>('setup')
  const [placementMode, setPlacementMode] = useState<PlacementMode>(null)
  const [graphType, setGraphType] = useState<GraphType>('x-t')
  const [showRegression, setShowRegression] = useState(false)
  const { detailLevel, setupWizardDismissed, setSetupWizardDismissed } = useUiStore()
  const advanced = detailLevel === 'advanced'

  // Basic view offers position graphs only — reset if a velocity graph was selected.
  useEffect(() => {
    if (!advanced && (graphType === 'vx-t' || graphType === 'vy-t')) {
      setGraphType('x-t')
    }
  }, [advanced, graphType])

  const { metadata, reset: resetVideo } = useVideoStore()
  const {
    addPoint,
    autoAdvance,
    setAutoAdvance,
    selectPoint,
    dataPoints,
    reset: resetTracking,
  } = useTrackingStore()
  const {
    setScalePoint1,
    setScalePoint2,
    setOrigin,
    pixelsPerUnit,
    reset: resetCoordinates,
  } = useCoordinateStore()
  const { nextFrame } = useVideoStore()

  // Setup wizard — the guided overlay drives the calibration flow. Opens once
  // per session unless permanently dismissed (applies to the sample too, so a
  // visitor on /try is walked through scale → track → analyze). A session close
  // (✕) hides it without persisting.
  const [wizardOpen, setWizardOpen] = useState(false)
  const wizardBootstrapped = useRef(false)
  useEffect(() => {
    if (wizardBootstrapped.current || setupWizardDismissed || readOnly) return
    if (mode === 'setup') {
      setWizardOpen(true)
      wizardBootstrapped.current = true
    }
  }, [mode, setupWizardDismissed, readOnly])

  const openGuide = useCallback(() => {
    setSetupWizardDismissed(false)
    setMode('setup')
    setPlacementMode(null)
    setWizardOpen(true)
  }, [setSetupWizardDismissed])

  const dismissWizard = useCallback(() => {
    setSetupWizardDismissed(true)
    setWizardOpen(false)
  }, [setSetupWizardDismissed])

  useHotkeys('mod+z', () => useTrackingStore.temporal.getState().undo(), [])
  useHotkeys('mod+shift+z, mod+y', () => useTrackingStore.temporal.getState().redo(), [])

  useHotkeys(
    'escape',
    () => {
      if (placementMode) setPlacementMode(null)
    },
    [placementMode],
  )

  useHotkeys(
    'delete, backspace',
    () => {
      const { selectedPointId, deletePoint } = useTrackingStore.getState()
      if (selectedPointId) deletePoint(selectedPointId)
    },
    [],
  )

  const handleCanvasClick = useCallback(
    (pixelX: number, pixelY: number) => {
      if (placementMode === 'scale1') {
        setScalePoint1({ x: pixelX, y: pixelY })
        setPlacementMode('scale2')
        return
      }
      if (placementMode === 'scale2') {
        setScalePoint2({ x: pixelX, y: pixelY })
        setPlacementMode(null)
        return
      }
      if (placementMode === 'origin') {
        setOrigin({ x: pixelX, y: pixelY })
        setPlacementMode(null)
        return
      }
      if (mode === 'track' && metadata) {
        const hit = dataPoints.find((p) => Math.hypot(p.pixelX - pixelX, p.pixelY - pixelY) <= 14)
        if (hit) {
          selectPoint(hit.id)
          return
        }
        const { currentFrame, currentTime } = useVideoStore.getState()
        addPoint({ frameNumber: currentFrame, time: currentTime, pixelX, pixelY })
        if (autoAdvance) nextFrame()
      }
    },
    [
      placementMode,
      setScalePoint1,
      setScalePoint2,
      setOrigin,
      mode,
      metadata,
      addPoint,
      autoAdvance,
      nextFrame,
      dataPoints,
      selectPoint,
    ],
  )

  const handleScaleToolStart = useCallback((pointMode: 'point1' | 'point2') => {
    setPlacementMode(pointMode === 'point1' ? 'scale1' : 'scale2')
  }, [])

  const handleOriginToolStart = useCallback(() => {
    setPlacementMode('origin')
  }, [])

  const handleChangeVideo = useCallback(() => {
    if (confirm('This will clear all tracking data. Continue?')) {
      resetVideo()
      resetTracking()
      resetCoordinates()
      setMode('setup')
      setPlacementMode(null)
    }
  }, [resetVideo, resetTracking, resetCoordinates])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header toolbar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">{sample ? 'Home' : 'Projects'}</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="22.5" cy="8.5" r="4.8" fill="#ff4e22" />
              <circle cx="14" cy="14" r="3.1" fill="#ff4e22" opacity=".6" />
              <circle cx="7.8" cy="19.2" r="2.1" fill="#ff4e22" opacity=".34" />
            </svg>
            <span className="font-display text-sm font-extrabold tracking-tight text-foreground">
              Speck<span className="text-primary">.</span>
            </span>
          </div>

          {readOnly ? (
            <span className="rounded bg-plasma/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-plasma-ink">
              View only
            </span>
          ) : sample ? (
            <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-flare-ink">
              Sample
            </span>
          ) : (
            saveStatus !== 'idle' && (
              <span className="flex items-center gap-1.5 text-xs">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving…</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-plasma" />
                    <span className="text-muted-foreground">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span className="text-destructive">Save failed</span>
                  </>
                )}
              </span>
            )
          )}
        </div>

        {/* Mode tabs */}
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode)
            setPlacementMode(null)
          }}
        >
          <TabsList className="bg-secondary/50">
            <TabsTrigger
              value="setup"
              className="gap-2 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Setup
            </TabsTrigger>
            <TabsTrigger
              value="track"
              data-tour="track-tab"
              className="gap-2 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!pixelsPerUnit}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Track
            </TabsTrigger>
            <TabsTrigger
              value="analyze"
              className="gap-2 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LineChart className="h-3.5 w-3.5" />
              Analyze
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* CTA (sample / shared) + Guide + Undo/Redo */}
        <div className="flex items-center gap-1">
          {(sample || readOnly) && (
            <>
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/">
                  Create your own
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
            </>
          )}
          {/* Share is owner-only: the sample and shared views have nothing to share. */}
          {projectId && !sample && !readOnly && (
            <>
              <ShareButton projectId={projectId} />
              <div className="mx-1 h-4 w-px bg-border" />
            </>
          )}

          {/* Editing affordances — meaningless for a read-only viewer */}
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={openGuide}
                title="Open the setup guide"
                className="gap-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Compass className="h-4 w-4" />
                Guide
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().undo()}
                title="Undo (Ctrl+Z)"
                className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().redo()}
                title="Redo (Ctrl+Shift+Z)"
                className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video panel (60%) */}
        <div className="flex w-3/5 flex-col border-r border-border">
          <div data-tour="stage" className="relative flex-1 overflow-hidden bg-background">
            {metadata ? (
              <VideoPlayer src={metadata.storageUrl}>
                <CanvasOverlay
                  width={metadata.width}
                  height={metadata.height}
                  onClick={readOnly ? undefined : handleCanvasClick}
                  enableDrag={!readOnly && mode === 'track' && !placementMode}
                />

                {/* Change video button (owner projects only) */}
                {!sample && !readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeVideo}
                    className="absolute right-4 top-4 z-20 gap-2 bg-black/50 text-scrim-foreground backdrop-blur-sm hover:bg-black/70 hover:text-scrim-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Change Video
                  </Button>
                )}

                {/* Placement mode indicator */}
                {placementMode && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                    <span className="text-xs text-warning">
                      {placementMode === 'scale1'
                        ? 'Click first scale point'
                        : placementMode === 'scale2'
                          ? 'Click second scale point'
                          : 'Click to set origin'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlacementMode(null)}
                      className="ml-2 text-warning/70 hover:text-warning"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </VideoPlayer>
            ) : projectId ? (
              <div className="flex h-full items-center justify-center p-8">
                <VideoUpload projectId={projectId} />
              </div>
            ) : null}
          </div>
          {metadata && <VideoControls />}
        </div>

        {/* Right: Tools/Data/Graph panel (40%) */}
        <div className="flex w-2/5 flex-col bg-background">
          {/* Setup mode: Coordinate tools */}
          {mode === 'setup' && (
            <div className="flex-1 space-y-4 overflow-auto p-4">
              <div data-tour="scale">
                <ScaleCalibration
                  onStartPlacement={handleScaleToolStart}
                  placementMode={
                    placementMode === 'scale1'
                      ? 'point1'
                      : placementMode === 'scale2'
                        ? 'point2'
                        : null
                  }
                />
              </div>
              <div data-tour="origin">
                <OriginTool
                  onStartPlacement={handleOriginToolStart}
                  isPlacing={placementMode === 'origin'}
                />
              </div>
              <div data-tour="axes">
                <AxisRotation />
              </div>
              <div data-tour="fps">
                <FrameRateControl />
              </div>

              {/* Calibration status */}
              {pixelsPerUnit && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs uppercase tracking-wider text-flare-ink">
                      Ready to track
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your coordinate system is calibrated. Switch to Track mode to begin marking data
                    points.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Track mode: Data table */}
          {mode === 'track' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="auto-advance"
                    checked={autoAdvance}
                    onCheckedChange={setAutoAdvance}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="auto-advance" className="text-sm text-muted-foreground">
                    Auto-advance frame
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">Click video to add point</span>
              </div>
              <DataTable className="flex-1" />
            </div>
          )}

          {/* Analyze mode: Graphs */}
          {mode === 'analyze' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-4 border-b border-border px-4 py-3">
                <Select value={graphType} onValueChange={(v) => setGraphType(v as GraphType)}>
                  <SelectTrigger className="w-28 border-input bg-secondary/50 text-sm text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-input bg-secondary">
                    <SelectItem value="x-t" className="text-foreground">
                      x vs t
                    </SelectItem>
                    <SelectItem value="y-t" className="text-foreground">
                      y vs t
                    </SelectItem>
                    {advanced && (
                      <>
                        <SelectItem value="vx-t" className="text-foreground">
                          vx vs t
                        </SelectItem>
                        <SelectItem value="vy-t" className="text-foreground">
                          vy vs t
                        </SelectItem>
                      </>
                    )}
                    <SelectItem value="y-x" className="text-foreground">
                      y vs x
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch
                    id="regression"
                    checked={showRegression}
                    onCheckedChange={setShowRegression}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="regression" className="text-sm text-muted-foreground">
                    Best fit
                  </Label>
                </div>
              </div>

              <Graph type={graphType} showRegression={showRegression} className="flex-1 m-4" />

              <DataTable className="h-56 border-t border-border" />
            </div>
          )}
        </div>
      </div>

      {/* Guided setup overlay — floats over the editor and points at each step */}
      {wizardOpen && mode === 'setup' && !readOnly && (
        <SetupWizard
          placementMode={placementMode}
          setPlacementMode={setPlacementMode}
          onClose={() => setWizardOpen(false)}
          onDismiss={dismissWizard}
          onStartTracking={() => {
            setWizardOpen(false)
            setMode('track')
          }}
        />
      )}
    </div>
  )
}
