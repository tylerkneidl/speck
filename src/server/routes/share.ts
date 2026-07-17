import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { dataPoints, db, projectSettings, projects } from '../db'
import { createLogger } from '../lib/logger'
import { presignReadUrl } from '../lib/storage'

const logger = createLogger('share')

/** Short-lived: the viewer re-mints on every page load, so links can't be hotlinked forever. */
const SHARE_VIDEO_EXPIRY = 3600 // 1 hour

export const shareRouter = new Hono()

/**
 * Public, read-only view of a project the owner chose to share. Intentionally
 * unauthenticated — the unguessable token *is* the credential — so it is
 * deliberately narrow:
 *  - only ever matches a project with `isPublic = true` (revoking flips that)
 *  - selects an explicit field list; `userId` is never returned
 *  - drops `storageKey` (keys are `${userId}/...`, so returning one would leak
 *    the owner) and serves the video via a freshly minted short-lived URL
 *    instead of anything stored/permanent
 */
shareRouter.get('/:token', async (c) => {
  const token = c.req.param('token')

  const [project] = await db
    .select({ id: projects.id, name: projects.name, updatedAt: projects.updatedAt })
    .from(projects)
    .where(and(eq(projects.shareToken, token), eq(projects.isPublic, true)))

  if (!project) {
    // Same response for "no such token" and "sharing revoked" — don't leak which.
    return c.json({ error: 'This share link is not valid' }, 404)
  }

  const [settings] = await db
    .select()
    .from(projectSettings)
    .where(eq(projectSettings.projectId, project.id))

  const points = await db
    .select({
      id: dataPoints.id,
      frameNumber: dataPoints.frameNumber,
      timeSeconds: dataPoints.timeSeconds,
      pixelX: dataPoints.pixelX,
      pixelY: dataPoints.pixelY,
    })
    .from(dataPoints)
    .where(eq(dataPoints.projectId, project.id))
    .orderBy(dataPoints.frameNumber)

  let videoMetadata: Record<string, unknown> | null = null
  const vm = settings?.videoMetadata
  if (vm) {
    const { storageKey, ...safe } = vm
    videoMetadata = storageKey
      ? { ...safe, storageUrl: await presignReadUrl(storageKey, SHARE_VIDEO_EXPIRY) }
      : safe
  }

  logger.info({ projectId: project.id }, 'Served shared project')

  return c.json({
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    settings: {
      videoMetadata,
      coordinateSystem: settings?.coordinateSystem ?? null,
      uiSettings: settings?.uiSettings ?? null,
    },
    dataPoints: points,
  })
})
