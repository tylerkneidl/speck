import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface VideoMetadata {
  storageUrl: string
  fileName: string
  duration: number
  frameRate: number
  width: number
  height: number
  totalFrames: number
  thumbnailUrl?: string
}

interface VideoState {
  metadata: VideoMetadata | null
  currentFrame: number
  currentTime: number
  isPlaying: boolean
  playbackSpeed: number

  setMetadata: (metadata: VideoMetadata) => void
  setCurrentFrame: (frame: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  nextFrame: () => void
  prevFrame: () => void
  jumpFrames: (delta: number) => void
  goToFirstFrame: () => void
  goToLastFrame: () => void
  reset: () => void
}

const initialState = {
  metadata: null,
  currentFrame: 0,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
}

export const useVideoStore = create<VideoState>()(
  immer((set, get) => ({
    ...initialState,

    setMetadata: (metadata) =>
      set((state) => {
        state.metadata = metadata
        state.currentFrame = 0
        state.currentTime = 0
      }),

    setCurrentFrame: (frame) =>
      set((state) => {
        const { metadata } = state
        if (!metadata) return

        const clampedFrame = Math.max(0, Math.min(frame, metadata.totalFrames - 1))
        state.currentFrame = clampedFrame
        state.currentTime = clampedFrame / metadata.frameRate
      }),

    setIsPlaying: (playing) =>
      set((state) => {
        state.isPlaying = playing
      }),

    setPlaybackSpeed: (speed) =>
      set((state) => {
        state.playbackSpeed = speed
      }),

    nextFrame: () => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame + 1)
    },

    prevFrame: () => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame - 1)
    },

    jumpFrames: (delta) => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame + delta)
    },

    goToFirstFrame: () => {
      get().setCurrentFrame(0)
    },

    goToLastFrame: () => {
      const { metadata, setCurrentFrame } = get()
      if (metadata) {
        setCurrentFrame(metadata.totalFrames - 1)
      }
    },

    reset: () => set(() => initialState),
  }))
)
