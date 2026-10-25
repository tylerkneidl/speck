import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db'
import { logger } from '../lib/logger'
import { BUCKET, s3Client } from '../lib/storage'

const CHECK_TIMEOUT_MS = 3000

type CheckResult = { ok: true; ms: number } | { ok: false; ms: number; error: string }

async function timed(check: () => Promise<unknown>): Promise<CheckResult> {
  const start = performance.now()
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        ),
      ),
    ])
    return { ok: true, ms: Math.round(performance.now() - start) }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { ok: false, ms: Math.round(performance.now() - start), error }
  }
}

export const healthRouter = new Hono()

// Liveness: the process is up and serving. Railway's deploy healthcheck uses
// this, so it must not depend on the database or bucket — a storage blip
// shouldn't block a deploy or restart the app.
healthRouter.get('/', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Readiness: the database and the video bucket answer. For the outside uptime
// monitor, which alerts on a non-200. Reports which dependency failed but not
// the raw error, since the endpoint is public.
healthRouter.get('/deep', async (c) => {
  const [database, bucket] = await Promise.all([
    timed(() => db.execute(sql`select 1`)),
    timed(() => s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }))),
  ])
  const ok = database.ok && bucket.ok
  if (!ok) logger.error({ database, bucket, requestId: c.get('requestId') }, 'Health check failed')

  const view = (r: CheckResult) => ({ ok: r.ok, ms: r.ms })
  return c.json(
    {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { database: view(database), bucket: view(bucket) },
    },
    ok ? 200 : 503,
  )
})
