import { create } from 'zustand'

/**
 * Per-user view preferences (not per-project) — persisted to localStorage so a
 * student's chosen complexity level follows them across projects and reloads.
 */
export type DetailLevel = 'basic' | 'advanced'

const KEY = 'speck:detailLevel'

function initialDetail(): DetailLevel {
  try {
    return localStorage.getItem(KEY) === 'advanced' ? 'advanced' : 'basic'
  } catch {
    return 'basic'
  }
}

interface UiState {
  /** 'basic' shows position only; 'advanced' reveals velocity + acceleration. */
  detailLevel: DetailLevel
  setDetailLevel: (level: DetailLevel) => void
}

export const useUiStore = create<UiState>((set) => ({
  detailLevel: initialDetail(),
  setDetailLevel: (level) => {
    try {
      localStorage.setItem(KEY, level)
    } catch {
      // ignore (private mode / SSR)
    }
    set({ detailLevel: level })
  },
}))
