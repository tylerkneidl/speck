import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { RedirectToSignIn } from '@clerk/clerk-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { SignedIn, SignedOut, useIsClerkAvailable } from '@/lib/auth'

import { VideoPlayer, VideoControls, VideoUpload } from '@/features/video/components'
import { CanvasOverlay } from '@/features/tracking/components'
import { DataTable } from '@/features/data-table/components'
import { Graph, type GraphType } from '@/features/graphing/components'
import { ScaleCalibration, OriginTool, AxisRotation } from '@/features/coordinates/components'

import { useVideoStore } from '@/stores/video'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Undo2, Redo2, ChevronLeft, Settings, Crosshair, LineChart, RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectEditor,
})

type Mode = 'setup' | 'track' | 'analyze'
type PlacementMode = 'scale1' | 'scale2' | 'origin' | null

function ProjectEditor() {
  const isClerkAvailable = useIsClerkAvailable()

  return (
    <>
      {isClerkAvailable && (
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      )}
      <SignedIn fallback={!isClerkAvailable ? <ProjectEditorContent /> : null}>
        <ProjectEditorContent />
      </SignedIn>
    </>
  )
}

function ProjectEditorContent() {
  const { projectId } = Route.useParams()

  const [mode, setMode] = useState<Mode>('setup')
  const [placementMode, setPlacementMode] = useState<PlacementMode>(null)
  const [graphType, setGraphType] = useState<GraphType>('x-t')
  const [showRegression, setShowRegression] = useState(false)

  const { metadata, reset: resetVideo } = useVideoStore()
  const { addPoint, autoAdvance, setAutoAdvance, reset: resetTracking } = useTrackingStore()
  const { setScalePoint1, setScalePoint2, setOrigin, scalePoint1, pixelsPerUnit, reset: resetCoordinates } =
    useCoordinateStore()
  const { nextFrame } = useVideoStore()

  // Undo/redo keyboard shortcuts
  useHotkeys(
    'mod+z',
    () => {
      useTrackingStore.temporal.getState().undo()
    },
    []
  )

  useHotkeys(
    'mod+shift+z, mod+y',
    () => {
      useTrackingStore.temporal.getState().redo()
    },
    []
  )

  // Escape to cancel placement
  useHotkeys(
    'escape',
    () => {
      if (placementMode) {
        setPlacementMode(null)
      }
    },
    [placementMode]
  )

  // Handle canvas click based on mode
  const handleCanvasClick = useCallback(
    (pixelX: number, pixelY: number) => {
      // Scale point placement
      if (placementMode === 'scale1') {
        setScalePoint1({ x: pixelX, y: pixelY })
        setPlacementMode('scale2') // Auto-advance to second point
        return
      }

      if (placementMode === 'scale2') {
        setScalePoint2({ x: pixelX, y: pixelY })
        setPlacementMode(null)
        return
      }

      // Origin placement
      if (placementMode === 'origin') {
        setOrigin({ x: pixelX, y: pixelY })
        setPlacementMode(null)
        return
      }

      // Track mode: add data points
      if (mode === 'track' && metadata) {
        const { currentFrame, currentTime } = useVideoStore.getState()
        addPoint({
          frameNumber: currentFrame,
          time: currentTime,
          pixelX,
          pixelY,
        })

        if (autoAdvance) {
          nextFrame()
        }
      }
    },
    [
      placementMode,
      scalePoint1,
      setScalePoint1,
      setScalePoint2,
      setOrigin,
      mode,
      metadata,
      addPoint,
      autoAdvance,
      nextFrame,
    ]
  )

  // Handle scale calibration tool
  const handleScaleToolStart = useCallback((pointMode: 'point1' | 'point2') => {
    setPlacementMode(pointMode === 'point1' ? 'scale1' : 'scale2')
  }, [])

  // Handle origin tool
  const handleOriginToolStart = useCallback(() => {
    setPlacementMode('origin')
  }, [])

  // Reset everything and allow re-upload
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
    <div className="flex h-screen flex-col bg-zinc-950">
          {/* Header toolbar */}
          <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Projects</span>
              </Link>

              <div className="h-4 w-px bg-zinc-800" />

              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                {projectId}
              </span>
            </div>

            {/* Mode tabs */}
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as Mode)
                setPlacementMode(null) // Cancel any placement when changing modes
              }}
            >
              <TabsList className="bg-zinc-800/50">
                <TabsTrigger
                  value="setup"
                  className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Setup
                </TabsTrigger>
                <TabsTrigger
                  value="track"
                  className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
                  disabled={!pixelsPerUnit}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Track
                </TabsTrigger>
                <TabsTrigger
                  value="analyze"
                  className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
                >
                  <LineChart className="h-3.5 w-3.5" />
                  Analyze
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().undo()}
                title="Undo (Ctrl+Z)"
                className="h-8 w-8 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().redo()}
                title="Redo (Ctrl+Shift+Z)"
                className="h-8 w-8 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Video panel (60%) */}
            <div className="flex w-3/5 flex-col border-r border-zinc-800">
              <div className="relative flex-1 overflow-hidden bg-zinc-950">
                {metadata ? (
                  <>
                    <VideoPlayer src={metadata.storageUrl} />
                    <CanvasOverlay
                      width={metadata.width}
                      height={metadata.height}
                      onClick={handleCanvasClick}
                    />

                    {/* Change video button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleChangeVideo}
                      className="absolute right-4 top-4 z-20 gap-2 bg-black/50 text-zinc-400 backdrop-blur-sm hover:bg-black/70 hover:text-zinc-200"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Change Video
                    </Button>

                    {/* Placement mode indicator */}
                    {placementMode && (
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        <span className="font-mono text-xs text-amber-400">
                          {placementMode === 'scale1'
                            ? 'Click first scale point'
                            : placementMode === 'scale2'
                              ? 'Click second scale point'
                              : 'Click to set origin'}
                        </span>
                        <button
                          onClick={() => setPlacementMode(null)}
                          className="ml-2 text-amber-500/70 hover:text-amber-400"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <VideoUpload />
                  </div>
                )}
              </div>
              {metadata && <VideoControls />}
            </div>

            {/* Right: Tools/Data/Graph panel (40%) */}
            <div className="flex w-2/5 flex-col bg-zinc-950">
              {/* Setup mode: Coordinate tools */}
              {mode === 'setup' && (
                <div className="flex-1 space-y-4 overflow-auto p-4">
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
                  <OriginTool
                    onStartPlacement={handleOriginToolStart}
                    isPlacing={placementMode === 'origin'}
                  />
                  <AxisRotation />

                  {/* Calibration status */}
                  {pixelsPerUnit && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                          Ready to track
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        Your coordinate system is calibrated. Switch to Track mode to begin marking
                        data points.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Track mode: Data table */}
              {mode === 'track' && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Track mode toolbar */}
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="auto-advance"
                        checked={autoAdvance}
                        onCheckedChange={setAutoAdvance}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <Label htmlFor="auto-advance" className="text-sm text-zinc-400">
                        Auto-advance frame
                      </Label>
                    </div>

                    {/* Click hint */}
                    <span className="font-mono text-xs text-zinc-600">
                      Click video to add point
                    </span>
                  </div>
                  <DataTable className="flex-1" />
                </div>
              )}

              {/* Analyze mode: Graphs */}
              {mode === 'analyze' && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Analyze toolbar */}
                  <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
                    <Select value={graphType} onValueChange={(v) => setGraphType(v as GraphType)}>
                      <SelectTrigger className="w-28 border-zinc-700 bg-zinc-800/50 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800">
                        <SelectItem value="x-t">x vs t</SelectItem>
                        <SelectItem value="y-t">y vs t</SelectItem>
                        <SelectItem value="vx-t">vx vs t</SelectItem>
                        <SelectItem value="vy-t">vy vs t</SelectItem>
                        <SelectItem value="y-x">y vs x</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="regression"
                        checked={showRegression}
                        onCheckedChange={setShowRegression}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="regression" className="text-sm text-zinc-400">
                        Best fit
                      </Label>
                    </div>
                  </div>

                  {/* Graph */}
                  <Graph type={graphType} showRegression={showRegression} className="flex-1 m-4" />

                  {/* Compact data table */}
                  <DataTable className="h-56 border-t border-zinc-800" />
                </div>
              )}
            </div>
          </div>
        </div>
  )
}
