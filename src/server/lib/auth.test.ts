import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Clerk's getAuth so we can drive the session state.
const { getAuthMock } = vi.hoisted(() => ({ getAuthMock: vi.fn() }))
vi.mock('@hono/clerk-auth', () => ({ getAuth: getAuthMock }))

import { requireAuth } from './auth'

function makeApp() {
  const app = new Hono()
  app.use('/protected', requireAuth())
  app.get('/protected', (c) => c.json({ userId: c.get('userId') }))
  return app
}

describe('requireAuth', () => {
  beforeEach(() => {
    getAuthMock.mockReset()
  })

  it('returns 401 when there is no authenticated session', async () => {
    getAuthMock.mockReturnValue({ userId: null })

    const res = await makeApp().request('/protected')

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when getAuth yields nothing', async () => {
    getAuthMock.mockReturnValue(null)

    const res = await makeApp().request('/protected')

    expect(res.status).toBe(401)
  })

  it('allows the request and exposes the real userId when authenticated', async () => {
    getAuthMock.mockReturnValue({ userId: 'user_123' })

    const res = await makeApp().request('/protected')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: 'user_123' })
  })
})
