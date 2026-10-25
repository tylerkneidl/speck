import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger'
import { requestLog } from './request-log'

function makeApp() {
  const app = new Hono()
  app.use('*', requestId())
  app.use('*', requestLog())
  app.get('/api/health', (c) => c.json({ status: 'ok' }))
  app.get('/api/projects/:id', (c) => c.json({ id: c.req.param('id') }))
  app.get('/api/broken', (c) => c.json({ error: 'nope' }, 500))
  return app
}

describe('requestLog', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('logs the route pattern, status and request ID, not the raw path', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    const res = await makeApp().request('/api/projects/abc-123', {
      headers: { 'X-Request-Id': 'req-1' },
    })
    expect(res.headers.get('X-Request-Id')).toBe('req-1')
    expect(info).toHaveBeenCalledOnce()
    const [fields] = info.mock.calls[0] as unknown as [Record<string, unknown>]
    expect(fields).toMatchObject({
      requestId: 'req-1',
      method: 'GET',
      route: '/api/projects/:id',
      status: 200,
    })
    expect(JSON.stringify(fields)).not.toContain('abc-123')
  })

  it('skips successful health checks', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    await makeApp().request('/api/health')
    expect(info).not.toHaveBeenCalled()
  })

  it('logs server errors at error level', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    await makeApp().request('/api/broken')
    expect(error).toHaveBeenCalledOnce()
  })
})
