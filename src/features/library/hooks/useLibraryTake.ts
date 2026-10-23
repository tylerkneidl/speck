import { useCoordinateStore } from '@/stores/coordinates'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useRef } from 'react'
import type { LabTake } from '../types'

/**
 * Loads a library take into the stores — no fetch, no auth, no auto-save — the
 * same way `/try` loads the sample. With `calibrated`, the take's known scale
 * and origin are applied so the student can go straight to tracking.
 * Everything is ephemeral; a reload starts over. Reloads when the take changes.
 */
export function useLibraryTake(take: LabTake | undefined, calibrated: boolean) {
  const loadedKey = useRef<string | null>(null)
  const key = take ? `${take.id}:${calibrated}` : null
  if (take && loadedKey.current !== key) {
    loadedKey.current = key
    useVideoStore.getState().reset()
    useCoordinateStore.getState().reset()
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()

    useVideoStore.getState().setMetadata(take.video)
    if (calibrated && take.coordinateSystem) {
      useCoordinateStore.getState().hydrate(take.coordinateSystem)
    }
  }
}
