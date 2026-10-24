import type { Point } from '@/stores/coordinates'
import { create } from 'zustand'

/**
 * On-video measurements that aren't tracking data — currently one angle, from
 * three clicks: a point on one side, the corner, a point on the other side.
 * Ephemeral: not saved and not part of undo history.
 */
interface MeasureState {
  anglePoints: Point[]
  addAnglePoint: (point: Point) => void
  clearAngle: () => void
}

export const useMeasureStore = create<MeasureState>()((set) => ({
  anglePoints: [],
  // A fourth click starts a new angle.
  addAnglePoint: (point) =>
    set((state) => ({
      anglePoints: state.anglePoints.length >= 3 ? [point] : [...state.anglePoints, point],
    })),
  clearAngle: () => set({ anglePoints: [] }),
}))
