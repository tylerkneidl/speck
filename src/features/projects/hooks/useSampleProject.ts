import { useCoordinateStore } from '@/stores/coordinates'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useRef } from 'react'
import { SAMPLE_PROJECT } from '../sampleProject'

/**
 * Hydrates the Zustand stores from the bundled sample project — no fetch, no
 * auth, no auto-save. Runs once on mount so the public `/try` route can render
 * the full editor over static assets. Undo/redo and edits work but are
 * ephemeral (nothing persists; a reload restores the pristine sample).
 */
export function useSampleProject() {
  const loaded = useRef(false)
  if (!loaded.current) {
    loaded.current = true
    useVideoStore.getState().reset()
    useCoordinateStore.getState().reset()
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()

    useCoordinateStore.getState().hydrate(SAMPLE_PROJECT.coordinateSystem)
    useTrackingStore.getState().hydrate(SAMPLE_PROJECT.dataPoints)
    useVideoStore.getState().setMetadata(SAMPLE_PROJECT.metadata)
  }
}
