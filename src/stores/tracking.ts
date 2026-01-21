import { temporal } from 'zundo'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Point {
  x: number
  y: number
}

interface DataPoint {
  id: string
  frameNumber: number
  time: number
  pixelX: number
  pixelY: number
}

interface TrackingState {
  // Data
  dataPoints: DataPoint[]
  selectedPointId: string | null

  // UI state
  currentFrame: number
  isPlaying: boolean
  trailLength: number
  autoAdvance: boolean

  // Actions
  addPoint: (point: Omit<DataPoint, 'id'>) => void
  updatePoint: (id: string, position: Point) => void
  deletePoint: (id: string) => void
  selectPoint: (id: string | null) => void
  setCurrentFrame: (frame: number) => void
  setIsPlaying: (playing: boolean) => void
  setTrailLength: (length: number) => void
  setAutoAdvance: (enabled: boolean) => void

  // Hydration from server
  hydrate: (points: DataPoint[]) => void
  reset: () => void
}

const initialState = {
  dataPoints: [],
  selectedPointId: null,
  currentFrame: 0,
  isPlaying: false,
  trailLength: 10,
  autoAdvance: true,
}

export const useTrackingStore = create<TrackingState>()(
  temporal(
    immer((set) => ({
      ...initialState,

      addPoint: (point) =>
        set((state) => {
          state.dataPoints.push({
            ...point,
            id: crypto.randomUUID(),
          })
        }),

      updatePoint: (id, position) =>
        set((state) => {
          const point = state.dataPoints.find((p) => p.id === id)
          if (point) {
            point.pixelX = position.x
            point.pixelY = position.y
          }
        }),

      deletePoint: (id) =>
        set((state) => {
          state.dataPoints = state.dataPoints.filter((p) => p.id !== id)
          if (state.selectedPointId === id) {
            state.selectedPointId = null
          }
        }),

      selectPoint: (id) =>
        set((state) => {
          state.selectedPointId = id
        }),

      setCurrentFrame: (frame) =>
        set((state) => {
          state.currentFrame = frame
        }),

      setIsPlaying: (playing) =>
        set((state) => {
          state.isPlaying = playing
        }),

      setTrailLength: (length) =>
        set((state) => {
          state.trailLength = length
        }),

      setAutoAdvance: (enabled) =>
        set((state) => {
          state.autoAdvance = enabled
        }),

      hydrate: (points) =>
        set((state) => {
          state.dataPoints = points
          state.selectedPointId = null
        }),

      reset: () => set(initialState),
    })),
    {
      limit: 50, // Keep 50 states in history
      partialize: (state) => {
        // Only track data changes, not UI state
        const { dataPoints } = state
        return { dataPoints }
      },
    },
  ),
)

// Expose undo/redo
export const { undo, redo, clear: clearHistory } = useTrackingStore.temporal.getState()
