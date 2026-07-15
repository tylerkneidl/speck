import { create } from 'zustand'

/**
 * Per-user view preferences (not per-project) — persisted to localStorage so a
 * student's chosen complexity level follows them across projects and reloads.
 */
export type DetailLevel = 'basic' | 'advanced'

const KEY = 'speck:detailLevel'
const WIZARD_KEY = 'speck:setupWizardDismissed'

function initialDetail(): DetailLevel {
  try {
    return localStorage.getItem(KEY) === 'advanced' ? 'advanced' : 'basic'
  } catch {
    return 'basic'
  }
}

function initialWizardDismissed(): boolean {
  try {
    return localStorage.getItem(WIZARD_KEY) === '1'
  } catch {
    return false
  }
}

interface UiState {
  /** 'basic' shows position only; 'advanced' reveals velocity + acceleration. */
  detailLevel: DetailLevel
  setDetailLevel: (level: DetailLevel) => void
  /** "Don't show again" for the setup wizard — persisted so it survives reloads. */
  setupWizardDismissed: boolean
  setSetupWizardDismissed: (dismissed: boolean) => void
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
  setupWizardDismissed: initialWizardDismissed(),
  setSetupWizardDismissed: (dismissed) => {
    try {
      localStorage.setItem(WIZARD_KEY, dismissed ? '1' : '0')
    } catch {
      // ignore (private mode / SSR)
    }
    set({ setupWizardDismissed: dismissed })
  },
}))
