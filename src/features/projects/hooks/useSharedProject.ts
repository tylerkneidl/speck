import { type ScaleUnit, useCoordinateStore } from '@/stores/coordinates'
import { type DataPoint, useTrackingStore } from '@/stores/tracking'
import { type VideoMetadata, useVideoStore } from '@/stores/video'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

/** Numeric columns come back from Postgres as strings. */
interface SharedPoint {
  id: string
  frameNumber: number
  timeSeconds: string
  pixelX: string
  pixelY: string
}

interface SharedProject {
  id: string
  name: string
  settings: {
    videoMetadata: VideoMetadata | null
    coordinateSystem: {
      scalePoint1?: { x: number; y: number } | null
      scalePoint2?: { x: number; y: number } | null
      scaleDistance?: number | null
      scaleUnit?: ScaleUnit
      origin?: { x: number; y: number }
      originSet?: boolean
      rotation?: number
      yAxisUp?: boolean
    } | null
    uiSettings: { trailLength?: number; autoAdvance?: boolean } | null
  } | null
  dataPoints: SharedPoint[]
}

/**
 * Loads a project from the public share endpoint into the stores for a
 * read-only view. Deliberately uses plain `fetch` rather than the Clerk-aware
 * api client — the whole point is that a signed-out visitor can open the link.
 * Nothing is saved back; the token is the only credential.
 */
export function useSharedProject(token: string) {
  const hydratedFor = useRef<string | null>(null)

  const query = useQuery<SharedProject>({
    queryKey: ['share', token],
    queryFn: async () => {
      const res = await fetch(`/api/share/${token}`)
      if (!res.ok) throw new Error('Share link is not valid')
      return res.json()
    },
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const data = query.data

  useEffect(() => {
    if (!data || hydratedFor.current === token) return

    useVideoStore.getState().reset()
    useCoordinateStore.getState().reset()
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()

    if (data.settings?.coordinateSystem) {
      useCoordinateStore.getState().hydrate(data.settings.coordinateSystem)
    }
    if (typeof data.settings?.uiSettings?.trailLength === 'number') {
      useTrackingStore.getState().setTrailLength(data.settings.uiSettings.trailLength)
    }

    const points: DataPoint[] = (data.dataPoints ?? []).map((p) => ({
      id: p.id,
      frameNumber: p.frameNumber,
      time: Number(p.timeSeconds),
      pixelX: Number(p.pixelX),
      pixelY: Number(p.pixelY),
    }))
    useTrackingStore.getState().hydrate(points)

    // storageUrl is already a freshly presigned, short-lived link from the server.
    if (data.settings?.videoMetadata) {
      useVideoStore.getState().setMetadata(data.settings.videoMetadata)
    }

    hydratedFor.current = token
  }, [data, token])

  return { isLoading: query.isLoading, isError: query.isError, name: data?.name }
}
