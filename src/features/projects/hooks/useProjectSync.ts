import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useApiClient } from '@/lib/api'
import { type ScaleUnit, useCoordinateStore } from '@/stores/coordinates'
import { type DataPoint, useTrackingStore } from '@/stores/tracking'
import { type VideoMetadata, useVideoStore } from '@/stores/video'

/** Points come back from Postgres numeric columns as strings. */
interface ServerPoint {
  id: string
  frameNumber: number
  timeSeconds: string
  pixelX: string
  pixelY: string
}

interface CoordinateSystemDTO {
  scalePoint1?: { x: number; y: number } | null
  scalePoint2?: { x: number; y: number } | null
  scaleDistance?: number | null
  scaleUnit?: ScaleUnit
  origin?: { x: number; y: number }
  rotation?: number
  yAxisUp?: boolean
}

interface ServerProject {
  id: string
  name: string
  settings: {
    videoMetadata: VideoMetadata | null
    coordinateSystem: CoordinateSystemDTO | null
    uiSettings: { trailLength?: number; autoAdvance?: boolean } | null
  } | null
  dataPoints: ServerPoint[]
}

const SETTINGS_DEBOUNCE = 1500
const POINTS_DEBOUNCE = 1200

function toClientPoint(p: ServerPoint): DataPoint {
  return {
    id: p.id,
    frameNumber: p.frameNumber,
    time: Number(p.timeSeconds),
    pixelX: Number(p.pixelX),
    pixelY: Number(p.pixelY),
  }
}

/**
 * Loads a project into the Zustand stores and keeps the server in sync.
 * - Fetches once (staleTime Infinity — we don't refetch while editing).
 * - Resets + hydrates the video / coordinate / tracking stores, mapping the
 *   server shape to the client shape and re-presigning the video from its key.
 * - Debounced auto-save: PUTs settings, and diffs data points (add new /
 *   delete removed) keyed on the client id the server now stores.
 */
export function useProjectSync(projectId: string) {
  const api = useApiClient()
  const hydratedFor = useRef<string | null>(null)
  const savedPointIds = useRef<Set<string>>(new Set())

  const query = useQuery<ServerProject>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('Failed to load project')
      return res.json()
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

  const data = query.data

  // 1) Hydrate stores once the project loads (reset first so switching projects can't bleed).
  useEffect(() => {
    if (!data || hydratedFor.current === projectId) return

    useVideoStore.getState().reset()
    useCoordinateStore.getState().reset()
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()

    const settings = data.settings
    if (settings?.coordinateSystem) {
      useCoordinateStore.getState().hydrate(settings.coordinateSystem)
    }
    if (settings?.uiSettings) {
      const ui = settings.uiSettings
      if (typeof ui.trailLength === 'number') useTrackingStore.getState().setTrailLength(ui.trailLength)
      if (typeof ui.autoAdvance === 'boolean') useTrackingStore.getState().setAutoAdvance(ui.autoAdvance)
    }

    const points = (data.dataPoints ?? []).map(toClientPoint)
    useTrackingStore.getState().hydrate(points)
    savedPointIds.current = new Set(points.map((p) => p.id))

    const vm = settings?.videoMetadata
    if (vm?.storageKey) {
      // The stored read URL has expired — re-presign a fresh one from the key.
      api('/api/upload/presign-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: vm.storageKey }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.readUrl) useVideoStore.getState().setMetadata({ ...vm, storageUrl: j.readUrl })
        })
        .catch(() => {})
    } else if (vm) {
      useVideoStore.getState().setMetadata(vm)
    }

    hydratedFor.current = projectId
  }, [data, projectId, api])

  // 2) Debounced settings auto-save (video metadata + coordinate system + ui settings).
  useEffect(() => {
    if (!data || hydratedFor.current !== projectId) return
    let timer: ReturnType<typeof setTimeout> | null = null

    const save = () => {
      const c = useCoordinateStore.getState()
      const t = useTrackingStore.getState()
      api(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoMetadata: useVideoStore.getState().metadata,
          coordinateSystem: {
            scalePoint1: c.scalePoint1,
            scalePoint2: c.scalePoint2,
            scaleDistance: c.scaleDistance,
            scaleUnit: c.scaleUnit,
            origin: c.origin,
            rotation: c.rotation,
            yAxisUp: c.yAxisUp,
          },
          uiSettings: { trailLength: t.trailLength, autoAdvance: t.autoAdvance },
        }),
      }).catch(() => {})
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(save, SETTINGS_DEBOUNCE)
    }

    const unsubs = [useVideoStore.subscribe(schedule), useCoordinateStore.subscribe(schedule)]
    return () => {
      for (const u of unsubs) u()
      if (timer) clearTimeout(timer)
    }
  }, [projectId, api, data])

  // 3) Debounced point sync — add new points, delete removed ones (diff by id).
  useEffect(() => {
    if (!data || hydratedFor.current !== projectId) return
    let timer: ReturnType<typeof setTimeout> | null = null

    const sync = async () => {
      const current = useTrackingStore.getState().dataPoints
      const currentIds = new Set(current.map((p) => p.id))
      const toAdd = current.filter((p) => !savedPointIds.current.has(p.id))
      const toDelete = [...savedPointIds.current].filter((id) => !currentIds.has(id))

      try {
        if (toAdd.length > 0) {
          const res = await api(`/api/projects/${projectId}/points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              points: toAdd.map((p) => ({
                id: p.id,
                frameNumber: p.frameNumber,
                timeSeconds: p.time,
                pixelX: p.pixelX,
                pixelY: p.pixelY,
              })),
            }),
          })
          if (res.ok) for (const p of toAdd) savedPointIds.current.add(p.id)
        }
        if (toDelete.length > 0) {
          const res = await api(`/api/projects/${projectId}/points`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pointIds: toDelete }),
          })
          if (res.ok) for (const id of toDelete) savedPointIds.current.delete(id)
        }
      } catch {
        // best-effort; the next change reschedules a sync
      }
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(sync, POINTS_DEBOUNCE)
    }

    const unsub = useTrackingStore.subscribe(schedule)
    return () => {
      unsub()
      if (timer) clearTimeout(timer)
    }
  }, [projectId, api, data])

  return { isLoading: query.isLoading, isError: query.isError }
}
