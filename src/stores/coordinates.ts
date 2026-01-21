import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type ScaleUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in'

export interface Point {
  x: number
  y: number
}

interface CoordinateState {
  scalePoint1: Point | null
  scalePoint2: Point | null
  scaleDistance: number | null
  scaleUnit: ScaleUnit
  origin: Point
  rotation: number
  yAxisUp: boolean
  pixelsPerUnit: number | null

  setScalePoint1: (point: Point) => void
  setScalePoint2: (point: Point) => void
  setScaleDistance: (distance: number) => void
  setScaleUnit: (unit: ScaleUnit) => void
  setOrigin: (point: Point) => void
  setRotation: (degrees: number) => void
  toggleYAxis: () => void
  hydrate: (system: Partial<CoordinateState>) => void
  reset: () => void
}

const initialState = {
  scalePoint1: null,
  scalePoint2: null,
  scaleDistance: null,
  scaleUnit: 'm' as ScaleUnit,
  origin: { x: 0, y: 0 },
  rotation: 0,
  yAxisUp: true,
  pixelsPerUnit: null,
}

function calculatePixelsPerUnit(
  p1: Point | null,
  p2: Point | null,
  distance: number | null
): number | null {
  if (!p1 || !p2 || !distance || distance === 0) return null
  const pixelDistance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  return pixelDistance / distance
}

export const useCoordinateStore = create<CoordinateState>()(
  immer((set) => ({
    ...initialState,

    setScalePoint1: (point) =>
      set((state) => {
        state.scalePoint1 = point
        state.pixelsPerUnit = calculatePixelsPerUnit(point, state.scalePoint2, state.scaleDistance)
      }),

    setScalePoint2: (point) =>
      set((state) => {
        state.scalePoint2 = point
        state.pixelsPerUnit = calculatePixelsPerUnit(state.scalePoint1, point, state.scaleDistance)
      }),

    setScaleDistance: (distance) =>
      set((state) => {
        state.scaleDistance = distance
        state.pixelsPerUnit = calculatePixelsPerUnit(
          state.scalePoint1,
          state.scalePoint2,
          distance
        )
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

    toggleYAxis: () =>
      set((state) => {
        state.yAxisUp = !state.yAxisUp
      }),

    hydrate: (system) =>
      set((state) => {
        if (system.scalePoint1 !== undefined) state.scalePoint1 = system.scalePoint1
        if (system.scalePoint2 !== undefined) state.scalePoint2 = system.scalePoint2
        if (system.scaleDistance !== undefined) state.scaleDistance = system.scaleDistance
        if (system.scaleUnit !== undefined) state.scaleUnit = system.scaleUnit
        if (system.origin !== undefined) state.origin = system.origin
        if (system.rotation !== undefined) state.rotation = system.rotation
        if (system.yAxisUp !== undefined) state.yAxisUp = system.yAxisUp
        state.pixelsPerUnit = calculatePixelsPerUnit(
          state.scalePoint1,
          state.scalePoint2,
          state.scaleDistance
        )
      }),

    reset: () => set(() => initialState),
  }))
)
