import { describe, it, expect, beforeEach } from 'vitest'
import { useVideoStore } from './video'

describe('useVideoStore', () => {
  beforeEach(() => {
    useVideoStore.getState().reset()
  })

  it('should start with null video metadata', () => {
    const state = useVideoStore.getState()
    expect(state.metadata).toBeNull()
  })

  it('should set video metadata', () => {
    const { setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    const state = useVideoStore.getState()
    expect(state.metadata?.fileName).toBe('test.mp4')
    expect(state.metadata?.totalFrames).toBe(300)
  })

  it('should track current frame', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(15)

    expect(useVideoStore.getState().currentFrame).toBe(15)
  })

  it('should clamp frame to valid range', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(-5)
    expect(useVideoStore.getState().currentFrame).toBe(0)

    setCurrentFrame(500)
    expect(useVideoStore.getState().currentFrame).toBe(299)
  })

  it('should calculate current time from frame', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(60)

    expect(useVideoStore.getState().currentTime).toBe(2) // 60 / 30 = 2 seconds
  })

  it('should reset all state to initial values', () => {
    const { setMetadata, setCurrentFrame, setIsPlaying, reset } = useVideoStore.getState()

    // Set up some state
    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })
    setCurrentFrame(60)
    setIsPlaying(true)

    // Verify state was set
    expect(useVideoStore.getState().metadata).not.toBeNull()
    expect(useVideoStore.getState().currentFrame).toBe(60)
    expect(useVideoStore.getState().isPlaying).toBe(true)

    // Reset
    reset()

    // Verify all state is back to initial
    const state = useVideoStore.getState()
    expect(state.metadata).toBeNull()
    expect(state.currentFrame).toBe(0)
    expect(state.currentTime).toBe(0)
    expect(state.isPlaying).toBe(false)
    expect(state.playbackSpeed).toBe(1)
  })
})
