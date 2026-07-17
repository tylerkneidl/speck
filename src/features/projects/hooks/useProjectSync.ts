import { useApiClient } from '@/lib/api'
import { type ScaleUnit, useCoordinateStore } from '@/stores/coordinates'
import { type DataPoint, useTrackingStore } from '@/stores/tracking'
import { type VideoMetadata, useVideoStore } from '@/stores/video'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
  originSet?: boolean
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

/** Fingerprint of a point's persisted values — changes when it's moved. */
export function pointPosKey(p: Pick<DataPoint, 'frameNumber' | 'pixelX' | 'pixelY'>): string {
  return `${p.frameNumber}|${p.pixelX}|${p.pixelY}`
}

/**
 * Diff the working points against what's saved. A point is "to upsert" if it's
 * new OR its position changed (dragged); "to delete" if it's saved but gone.
 * `saved` maps point id → its last-saved pointPosKey.
 */
export function diffPoints(
  current: DataPoint[],
  saved: Map<string, string>,
): { toUpsert: DataPoint[]; toDelete: string[] } {
  const currentIds = new Set(current.map((p) => p.id))
  const toUpsert = current.filter((p) => saved.get(p.id) !== pointPosKey(p))
  const toDelete = [...saved.keys()].filter((id) => !currentIds.has(id))
  return { toUpsert, toDelete }
}

/**
 * Loads a project into the Zustand stores and keeps the server in sync.
 * - Fetches once (staleTime Infinity — we don't refetch while editing).
 * - Resets + hydrates the stores, mapping the server shape to the client shape
 *   and re-presigning the video from its stored key.
 * - Debounced auto-save: PUTs settings (only on real metadata / coordinate / ui
 *   changes, never on playback), and diffs data points (add new / delete removed).
 */
export function useProjectSync(projectId: string) {
  const api = useApiClient()
  const hydratedFor = useRef<string | null>(null)
  // point id → last-saved position fingerprint (for add / move / delete diffing)
  const savedPoints = useRef<Map<string, string>>(new Map())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

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
      if (typeof ui.trailLength === 'number')
        useTrackingStore.getState().setTrailLength(ui.trailLength)
      if (typeof ui.autoAdvance === 'boolean')
        useTrackingStore.getState().setAutoAdvance(ui.autoAdvance)
    }

    const points = (data.dataPoints ?? []).map(toClientPoint)
    useTrackingStore.getState().hydrate(points)
    savedPoints.current = new Map(points.map((p) => [p.id, pointPosKey(p)]))

    const vm = settings?.videoMetadata
    if (vm?.storageKey) {
      // The stored read URL has expired — ask for a fresh one. The server
      // resolves the key from the (ownership-checked) project; we never send it.
      api('/api/upload/presign-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
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

  // 2) Debounced settings auto-save. Triggers only on persisted changes — coordinate
  //    system, video *metadata*, and ui prefs — never on frame/playback churn.
  useEffect(() => {
    if (!data || hydratedFor.current !== projectId) return
    let timer: ReturnType<typeof setTimeout> | null = null

    const save = () => {
      const c = useCoordinateStore.getState()
      const t = useTrackingStore.getState()
      setSaveStatus('saving')
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
            originSet: c.originSet,
            rotation: c.rotation,
            yAxisUp: c.yAxisUp,
          },
          uiSettings: { trailLength: t.trailLength, autoAdvance: t.autoAdvance },
        }),
      })
        .then((r) => setSaveStatus(r.ok ? 'saved' : 'error'))
        .catch(() => setSaveStatus('error'))
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(save, SETTINGS_DEBOUNCE)
    }

    let lastMeta = useVideoStore.getState().metadata
    let lastTrail = useTrackingStore.getState().trailLength
    let lastAuto = useTrackingStore.getState().autoAdvance

    const unsubs = [
      useCoordinateStore.subscribe(schedule),
      useVideoStore.subscribe(() => {
        const m = useVideoStore.getState().metadata
        if (m !== lastMeta) {
          lastMeta = m
          schedule()
        }
      }),
      useTrackingStore.subscribe(() => {
        const t = useTrackingStore.getState()
        if (t.trailLength !== lastTrail || t.autoAdvance !== lastAuto) {
          lastTrail = t.trailLength
          lastAuto = t.autoAdvance
          schedule()
        }
      }),
    ]
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
      const { toUpsert, toDelete } = diffPoints(current, savedPoints.current)
      if (toUpsert.length === 0 && toDelete.length === 0) return

      setSaveStatus('saving')
      try {
        if (toUpsert.length > 0) {
          // POST upserts on the server (new points insert, moved points update).
          const res = await api(`/api/projects/${projectId}/points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              points: toUpsert.map((p) => ({
                id: p.id,
                frameNumber: p.frameNumber,
                timeSeconds: p.time,
                pixelX: p.pixelX,
                pixelY: p.pixelY,
              })),
            }),
          })
          if (res.ok) for (const p of toUpsert) savedPoints.current.set(p.id, pointPosKey(p))
        }
        if (toDelete.length > 0) {
          const res = await api(`/api/projects/${projectId}/points`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pointIds: toDelete }),
          })
          if (res.ok) for (const id of toDelete) savedPoints.current.delete(id)
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
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

  return { isLoading: query.isLoading, isError: query.isError, saveStatus }
}
