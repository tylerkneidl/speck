import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  Rewind,
  FastForward,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVideoStore } from '@/stores/video'

export function VideoControls() {
  const {
    metadata,
    currentFrame,
    currentTime,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setIsPlaying,
    setPlaybackSpeed,
    nextFrame,
    prevFrame,
    jumpFrames,
    goToFirstFrame,
    goToLastFrame,
  } = useVideoStore()

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  // Keyboard shortcuts
  useHotkeys(
    'space',
    (e) => {
      e.preventDefault()
      togglePlayPause()
    },
    [togglePlayPause]
  )

  useHotkeys('right, .', () => nextFrame(), [nextFrame])
  useHotkeys('left, ,', () => prevFrame(), [prevFrame])
  useHotkeys('shift+right', () => jumpFrames(10), [jumpFrames])
  useHotkeys('shift+left', () => jumpFrames(-10), [jumpFrames])
  useHotkeys('home', () => goToFirstFrame(), [goToFirstFrame])
  useHotkeys('end', () => goToLastFrame(), [goToLastFrame])

  const handleSliderChange = useCallback(
    (value: number[]) => {
      if (value[0] !== undefined) {
        setCurrentFrame(value[0])
      }
    },
    [setCurrentFrame]
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(2)
    return `${mins}:${secs.padStart(5, '0')}`
  }

  if (!metadata) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-900 p-4">
      {/* Timeline scrubber */}
      <div className="group relative">
        <Slider
          value={[currentFrame]}
          max={metadata.totalFrames - 1}
          step={1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        {/* Frame markers (tick marks every 10%) */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2.5">
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className="h-1 w-px bg-zinc-700 opacity-50"
            />
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: Navigation buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToFirstFrame}
            title="First frame (Home)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => jumpFrames(-10)}
            title="Back 10 frames (Shift+Left)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Rewind className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevFrame}
            title="Previous frame (Left/,)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause - larger and accented */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            title="Play/Pause (Space)"
            className="mx-1 h-10 w-10 rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextFrame}
            title="Next frame (Right/.)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => jumpFrames(10)}
            title="Forward 10 frames (Shift+Right)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <FastForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToLastFrame}
            title="Last frame (End)"
            className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Time and frame display */}
        <div className="flex items-center gap-3 font-mono text-sm">
          <div className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-1.5">
            <span className="text-zinc-100">{formatTime(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{formatTime(metadata.duration)}</span>
          </div>
          <div className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-1.5">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              Frame
            </span>
            <span className="text-zinc-100">
              {String(currentFrame + 1).padStart(4, '0')}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{metadata.totalFrames}</span>
          </div>
        </div>

        {/* Right: Speed selector */}
        <Select
          value={playbackSpeed.toString()}
          onValueChange={(v) => setPlaybackSpeed(Number.parseFloat(v))}
        >
          <SelectTrigger className="w-24 border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-800">
            <SelectItem value="0.25" className="text-zinc-100 focus:bg-zinc-700">
              0.25x
            </SelectItem>
            <SelectItem value="0.5" className="text-zinc-100 focus:bg-zinc-700">
              0.5x
            </SelectItem>
            <SelectItem value="1" className="text-zinc-100 focus:bg-zinc-700">
              1x
            </SelectItem>
            <SelectItem value="2" className="text-zinc-100 focus:bg-zinc-700">
              2x
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
