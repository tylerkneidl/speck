import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { logger } from '../lib/logger'
import { clientLogRouter } from './client-log'

const app = new Hono().route('/api/log', clientLogRouter)
const post = (body: unknown) =>
  app.request('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/log', () => {
  it('logs a valid report and returns nothing', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const res = await post({ message: 'boom', path: '/library', boundary: 'route' })
    expect(res.status).toBe(204)
    expect(error).toHaveBeenCalledOnce()
  })

  it('rejects malformed and oversized reports', async () => {
    expect((await post({ message: 'boom' })).status).toBe(400)
    expect((await post({ message: 'x'.repeat(1001), boundary: 'route' })).status).toBe(400)
    const res = await app.request('/api/log', { method: 'POST', body: 'not json' })
    expect(res.status).toBe(400)
  })
})
