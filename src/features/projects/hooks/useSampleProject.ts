import { useCoordinateStore } from '@/stores/coordinates'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useRef } from 'react'
import { SAMPLE_PROJECT } from '../sampleProject'

/**
 * Preloads the bundled sample *video* into the stores — no fetch, no auth, no
 * auto-save — so the public `/try` route drops a visitor straight into a real
 * clip and lets them do scale → track → analyze themselves, guided by the setup
 * wizard. Starts uncalibrated with no points on purpose (it's a hands-on try,
 * not a finished showcase). Everything is ephemeral; a reload starts over.
 *
 * (SAMPLE_PROJECT also carries the finished coordinate system + points as a
 * reference solution — intentionally not loaded here.)
 */
export function useSampleProject() {
  const loaded = useRef(false)
  if (!loaded.current) {
    loaded.current = true
    useVideoStore.getState().reset()
    useCoordinateStore.getState().reset()
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()

    useVideoStore.getState().setMetadata(SAMPLE_PROJECT.metadata)
  }
}
