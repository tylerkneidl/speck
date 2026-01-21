import { useCallback, useEffect, useRef, useState } from 'react'
import { useVideoStore } from '@/stores/video'

interface VideoPlayerProps {
  src: string | null
  onFrameChange?: (frame: number) => void
}

export function VideoPlayer({ src, onFrameChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    metadata,
    currentFrame,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setIsPlaying,
  } = useVideoStore()

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Seek to frame when currentFrame changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !metadata) return

    const targetTime = currentFrame / metadata.frameRate
    if (Math.abs(video.currentTime - targetTime) > 0.001) {
      video.currentTime = targetTime
    }
  }, [currentFrame, metadata])

  // Draw current frame to canvas when paused
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = frameCanvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
  }, [])

  // Handle video seeked event
  const handleSeeked = useCallback(() => {
    if (!isPlaying) {
      drawFrame()
    }
    onFrameChange?.(currentFrame)
  }, [isPlaying, drawFrame, currentFrame, onFrameChange])

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
      drawFrame()
    }
  }, [isPlaying, drawFrame])

  // Handle playback speed
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Update frame during playback
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !metadata || !isPlaying) return

    const frame = Math.floor(video.currentTime * metadata.frameRate)
    if (frame !== currentFrame) {
      setCurrentFrame(frame)
    }
  }, [metadata, isPlaying, currentFrame, setCurrentFrame])

  // Handle video end
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])

  // Calculate display dimensions maintaining aspect ratio
  useEffect(() => {
    if (!metadata || !containerRef.current) return

    const updateDimensions = () => {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const videoAspect = metadata.width / metadata.height
      const containerAspect = containerWidth / containerHeight

      let width: number
      let height: number

      if (videoAspect > containerAspect) {
        width = containerWidth
        height = containerWidth / videoAspect
      } else {
        height = containerHeight
        width = containerHeight * videoAspect
      }

      setDimensions({ width, height })
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [metadata])

  if (!src) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950">
        {/* Technical grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        {/* Center crosshair */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-px w-8 bg-zinc-700" />
          <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-zinc-700" />
        </div>
        <p className="font-mono text-sm tracking-wider text-zinc-600">
          NO VIDEO LOADED
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950"
    >
      {/* Subtle vignette effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Video element - shown during playback */}
      <video
        ref={videoRef}
        src={src}
        className={isPlaying ? 'block' : 'hidden'}
        style={{ width: dimensions.width, height: dimensions.height }}
        onSeeked={handleSeeked}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline
        muted
      />

      {/* Canvas element - shown when paused for frame-accurate display */}
      <canvas
        ref={frameCanvasRef}
        className={isPlaying ? 'hidden' : 'block'}
        style={{ width: dimensions.width, height: dimensions.height }}
      />

      {/* Frame info overlay */}
      {metadata && (
        <div className="absolute bottom-3 left-3 z-20 font-mono text-xs text-zinc-400">
          <span className="rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
            {String(currentFrame).padStart(5, '0')} /{' '}
            {String(metadata.totalFrames - 1).padStart(5, '0')}
          </span>
        </div>
      )}
    </div>
  )
}
