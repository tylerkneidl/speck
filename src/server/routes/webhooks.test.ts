import type { WebhookEvent } from '@clerk/backend/webhooks'
import { describe, expect, it, vi } from 'vitest'
import { type PurgeDeps, handleClerkEvent } from './clerk-events'

/** Deps that record call order so we can assert the purge sequence. */
function makeDeps(keys: string[] = []) {
  const calls: string[] = []
  const deps: PurgeDeps = {
    listUserStorageKeys: vi.fn(async (id: string) => {
      calls.push(`list:${id}`)
      return keys
    }),
    deleteObjects: vi.fn(async (k: string[]) => {
      calls.push(`objects:${k.join(',')}`)
    }),
    deleteUserProjects: vi.fn(async (id: string) => {
      calls.push(`projects:${id}`)
    }),
  }
  return { deps, calls }
}

const evt = (type: string, data: object) => ({ type, data }) as unknown as WebhookEvent

describe('handleClerkEvent', () => {
  it('purges the user’s storage and projects on user.deleted', async () => {
    const { deps, calls } = makeDeps(['u1/a.mp4', 'u1/b.mp4'])
    await handleClerkEvent(evt('user.deleted', { id: 'u1' }), deps)
    expect(calls).toEqual(['list:u1', 'objects:u1/a.mp4,u1/b.mp4', 'projects:u1'])
  })

  it('deletes objects BEFORE projects (keys live in the rows the cascade drops)', async () => {
    const { deps, calls } = makeDeps(['u1/a.mp4'])
    await handleClerkEvent(evt('user.deleted', { id: 'u1' }), deps)
    expect(calls.indexOf('objects:u1/a.mp4')).toBeLessThan(calls.indexOf('projects:u1'))
  })

  it('does nothing when user.deleted has no id (deleted-object stub)', async () => {
    const { deps, calls } = makeDeps()
    await handleClerkEvent(evt('user.deleted', {}), deps)
    expect(calls).toEqual([])
  })

  it('ignores non-deletion events', async () => {
    const { deps, calls } = makeDeps(['x'])
    await handleClerkEvent(evt('user.created', { id: 'u1' }), deps)
    expect(calls).toEqual([])
  })
})
