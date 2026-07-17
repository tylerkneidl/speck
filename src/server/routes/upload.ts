import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db, projectSettings, projects } from '../db'
import { getUserId } from '../lib/auth'
import { createLogger } from '../lib/logger'
import { BUCKET, presignReadUrl, s3Client } from '../lib/storage'

const logger = createLogger('upload')

const PRESIGN_EXPIRY = 3600 // 1 hour
const READ_EXPIRY = 86400 // 24 hours

export const uploadRouter = new Hono()

// Validation constants
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

/** Ownership is now checked against the DB rather than inferred from the key prefix. */
async function ownsProject(userId: string, projectId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  return !!row
}

/** Keys are `${projectId}/${fileName}`, so the name must not add path segments. */
function safeFileName(name: string): string {
  return (name || 'video').replace(/[^\w.-]/g, '_').slice(0, 120)
}

// Get presigned URL for upload
uploadRouter.post('/presign', async (c) => {
  const userId = getUserId(c)
  const body = await c.req.json<{
    fileName: string
    contentType: string
    fileSize: number
    projectId: string
  }>()

  // Validate file size
  if (body.fileSize > MAX_FILE_SIZE) {
    return c.json({ error: 'File too large. Maximum size is 500MB.' }, 400)
  }

  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.includes(body.contentType)) {
    return c.json({ error: 'Invalid file type. Allowed: MP4, WebM, MOV.' }, 400)
  }

  // Previously the `${userId}/` key prefix was the only thing stopping a caller
  // from presigning an upload against someone else's projectId. Now that keys
  // don't carry the userId, ownership must be checked explicitly.
  if (!body.projectId || !(await ownsProject(userId, body.projectId))) {
    return c.json({ error: 'Project not found' }, 404)
  }

  // No userId in the key: a share link presigns from this key, and the URL path
  // would otherwise expose the owner's id to every viewer.
  const key = `${body.projectId}/${safeFileName(body.fileName)}`

  logger.info(
    { userId, projectId: body.projectId, fileName: body.fileName },
    'Generating presigned URL',
  )

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: body.contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY })
    const readUrl = await presignReadUrl(key, READ_EXPIRY)

    return c.json({
      uploadUrl,
      readUrl,
      key,
    })
  } catch (err) {
    logger.error({ err, key }, 'Failed to generate presigned URL')
    return c.json({ error: 'Failed to generate upload URL' }, 500)
  }
})

/**
 * Refresh an expired read URL for a project's video.
 *
 * Takes a projectId — never a client-supplied key. The old contract accepted any
 * key and authorized it with `key.startsWith(userId + '/')`, which (a) was an
 * IDOR waiting to happen once keys stopped carrying the userId, and (b) is moot
 * now that they don't. Resolving the key server-side from the owned project also
 * keeps working for objects uploaded under the old `${userId}/…` layout.
 */
uploadRouter.post('/presign-read', async (c) => {
  const userId = getUserId(c)
  const body = await c.req.json<{ projectId?: string }>()

  if (!body.projectId || !(await ownsProject(userId, body.projectId))) {
    return c.json({ error: 'Project not found' }, 404)
  }

  const [settings] = await db
    .select()
    .from(projectSettings)
    .where(eq(projectSettings.projectId, body.projectId))

  const key = settings?.videoMetadata?.storageKey
  if (!key) {
    return c.json({ error: 'No video for this project' }, 404)
  }

  try {
    return c.json({ readUrl: await presignReadUrl(key, READ_EXPIRY) })
  } catch (err) {
    logger.error({ err, projectId: body.projectId }, 'Failed to generate read URL')
    return c.json({ error: 'Failed to generate read URL' }, 500)
  }
})
