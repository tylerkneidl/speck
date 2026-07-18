import type { WebhookEvent } from '@clerk/backend/webhooks'
import { createLogger } from '../lib/logger'

const logger = createLogger('webhooks')

/** Side effects a Clerk event may trigger — injected so the logic is testable
 *  without a DB connection (the route wires the real Postgres/storage deps). */
export interface PurgeDeps {
  /** Storage keys for every video the user owns (gathered before rows are deleted). */
  listUserStorageKeys: (userId: string) => Promise<string[]>
  /** Delete the user's projects; FK cascade removes settings + data points. */
  deleteUserProjects: (userId: string) => Promise<void>
  deleteObjects: (keys: string[]) => Promise<void>
}

/**
 * Applies the side effects for a verified Clerk event. Only user.deleted does
 * anything today: purge the user's projects and their stored videos so a
 * deleted account leaves nothing orphaned in Postgres or the bucket. Storage is
 * cleared BEFORE the rows (the keys live in the rows the cascade will drop).
 */
export async function handleClerkEvent(event: WebhookEvent, deps: PurgeDeps): Promise<void> {
  if (event.type !== 'user.deleted') return
  const userId = event.data.id
  if (!userId) return // deleted-object stubs can omit the id

  const keys = await deps.listUserStorageKeys(userId)
  await deps.deleteObjects(keys)
  await deps.deleteUserProjects(userId)
  logger.info({ userId, objects: keys.length }, 'Purged data for deleted user')
}
