import type { WebhookEvent } from '@clerk/backend/webhooks'
import { verifyWebhook } from '@clerk/hono/webhooks'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db, projectSettings, projects } from '../db'
import { createLogger } from '../lib/logger'
import { deleteObjects } from '../lib/storage'
import { handleClerkEvent } from './clerk-events'

const logger = createLogger('webhooks')

export const webhooksRouter = new Hono()

/**
 * Clerk webhook receiver. Public by design — there is no Clerk session on these
 * requests; authenticity is the Svix signature, verified against
 * CLERK_WEBHOOK_SIGNING_SECRET. Configure the endpoint
 * (https://specklab.io/api/webhooks/clerk) and subscribe to `user.deleted` in
 * the Clerk dashboard. Always 2xx once verified so Clerk doesn't retry.
 */
webhooksRouter.post('/clerk', async (c) => {
  let event: WebhookEvent
  try {
    event = await verifyWebhook(c)
  } catch (err) {
    logger.warn({ err }, 'Rejected unverified Clerk webhook')
    return c.json({ error: 'Invalid signature' }, 400)
  }

  try {
    await handleClerkEvent(event, {
      listUserStorageKeys: async (userId) => {
        const rows = await db
          .select({ videoMetadata: projectSettings.videoMetadata })
          .from(projects)
          .leftJoin(projectSettings, eq(projectSettings.projectId, projects.id))
          .where(eq(projects.userId, userId))
        return rows.map((r) => r.videoMetadata?.storageKey).filter((k): k is string => !!k)
      },
      deleteUserProjects: async (userId) => {
        await db.delete(projects).where(eq(projects.userId, userId))
      },
      deleteObjects,
    })
  } catch (err) {
    // Log and still 2xx: a partial purge that keeps failing shouldn't make Clerk
    // hammer us with retries. The gap is surfaced in logs for follow-up.
    logger.error({ err, type: event.type }, 'Failed handling Clerk webhook')
  }

  return c.json({ ok: true })
})
