import type { CoordinateSystem } from '@/server/db/schema'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Point {
  x: number
  y: number
}

interface CoordinateState {
  // Coordinate system data
  scalePoint1: Point | null
  scalePoint2: Point | null
  scaleDistance: number
  scaleUnit: CoordinateSystem['scaleUnit']
  origin: Point
  rotation: number // degrees
  yAxisUp: boolean

  // Derived values (cached)
  pixelsPerUnit: number | null

  // Actions
  setScalePoint1: (point: Point) => void
  setScalePoint2: (point: Point) => void
  setScaleDistance: (distance: number) => void
  setScaleUnit: (unit: CoordinateSystem['scaleUnit']) => void
  setOrigin: (point: Point) => void
  setRotation: (degrees: number) => void
  setYAxisUp: (up: boolean) => void

  // Coordinate transformation
  pixelToWorld: (pixel: Point) => Point
  worldToPixel: (world: Point) => Point

  // Hydration
  hydrate: (system: CoordinateSystem) => void
  reset: () => void
}

const initialState = {
  scalePoint1: null,
  scalePoint2: null,
  scaleDistance: 1,
  scaleUnit: 'm' as const,
  origin: { x: 0, y: 0 },
  rotation: 0,
  yAxisUp: true,
  pixelsPerUnit: null,
}

export const useCoordinateStore = create<CoordinateState>()(
  immer((set, get) => ({
    ...initialState,

    setScalePoint1: (point) =>
      set((state) => {
        state.scalePoint1 = point
        recalculatePixelsPerUnit(state)
      }),

    setScalePoint2: (point) =>
      set((state) => {
        state.scalePoint2 = point
        recalculatePixelsPerUnit(state)
      }),

    setScaleDistance: (distance) =>
      set((state) => {
        state.scaleDistance = distance
        recalculatePixelsPerUnit(state)
      }),

    setScaleUnit: (unit) =>
      set((state) => {
        state.scaleUnit = unit
      }),

    setOrigin: (point) =>
      set((state) => {
        state.origin = point
      }),

    setRotation: (degrees) =>
      set((state) => {
        state.rotation = degrees
      }),

    setYAxisUp: (up) =>
      set((state) => {
        state.yAxisUp = up
      }),

    pixelToWorld: (pixel) => {
      const state = get()
      if (!state.pixelsPerUnit) {
        return { x: 0, y: 0 }
      }

      // Step 1: Translate to origin
      const translated = {
        x: pixel.x - state.origin.x,
        y: pixel.y - state.origin.y,
      }

      // Step 2: Apply rotation
      const radians = (state.rotation * Math.PI) / 180
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      const rotated = {
        x: translated.x * cos + translated.y * sin,
        y: -translated.x * sin + translated.y * cos,
      }

      // Step 3: Apply Y-axis direction
      if (state.yAxisUp) {
        rotated.y = -rotated.y
      }

      // Step 4: Convert to world units
      return {
        x: rotated.x / state.pixelsPerUnit,
        y: rotated.y / state.pixelsPerUnit,
      }
    },

    worldToPixel: (world) => {
      const state = get()
      if (!state.pixelsPerUnit) {
        return { x: 0, y: 0 }
      }

      // Reverse of pixelToWorld
      const scaled = {
        x: world.x * state.pixelsPerUnit,
        y: world.y * state.pixelsPerUnit,
      }

      if (state.yAxisUp) {
        scaled.y = -scaled.y
      }

      const radians = (state.rotation * Math.PI) / 180
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      const rotated = {
        x: scaled.x * cos - scaled.y * sin,
        y: scaled.x * sin + scaled.y * cos,
      }

      return {
        x: rotated.x + state.origin.x,
        y: rotated.y + state.origin.y,
      }
    },

    hydrate: (system) =>
      set((state) => {
        state.scalePoint1 = system.scalePoint1
        state.scalePoint2 = system.scalePoint2
        state.scaleDistance = system.scaleDistance
        state.scaleUnit = system.scaleUnit
        state.origin = system.origin
        state.rotation = system.rotation
        state.yAxisUp = system.yAxisUp
        recalculatePixelsPerUnit(state)
      }),

    reset: () => set(initialState),
  })),
)

// Helper to recalculate pixels per unit
function recalculatePixelsPerUnit(state: {
  scalePoint1: Point | null
  scalePoint2: Point | null
  scaleDistance: number
  pixelsPerUnit: number | null
}) {
  if (state.scalePoint1 && state.scalePoint2 && state.scaleDistance > 0) {
    const dx = state.scalePoint2.x - state.scalePoint1.x
    const dy = state.scalePoint2.y - state.scalePoint1.y
    const pixelDistance = Math.sqrt(dx * dx + dy * dy)
    state.pixelsPerUnit = pixelDistance / state.scaleDistance
  } else {
    state.pixelsPerUnit = null
  }
}
