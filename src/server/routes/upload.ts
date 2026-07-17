import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Hono } from 'hono'
import { getUserId } from '../lib/auth'
import { createLogger } from '../lib/logger'
import { BUCKET, s3Client } from '../lib/storage'

const logger = createLogger('upload')

const PRESIGN_EXPIRY = 3600 // 1 hour

export const uploadRouter = new Hono()

// Validation constants
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

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

  const key = `${userId}/${body.projectId}/${body.fileName}`

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

    // Also generate a read URL for after upload completes
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
    const readUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 86400 }) // 24 hours

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

// Get presigned URL for reading (refresh expired URLs)
uploadRouter.post('/presign-read', async (c) => {
  const userId = getUserId(c)
  const body = await c.req.json<{ key: string }>()

  // Basic ownership guard: object keys are prefixed with the owner's userId.
  // Full project-ownership verification is tracked in SPE-19.
  if (!body.key || !body.key.startsWith(`${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: body.key,
    })

    const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 })

    return c.json({ readUrl })
  } catch (err) {
    logger.error({ err, key: body.key }, 'Failed to generate read URL')
    return c.json({ error: 'Failed to generate read URL' }, 500)
  }
})
