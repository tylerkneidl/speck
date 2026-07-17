import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { THEME_COLORS, getActiveTheme, getThemeColors, useThemeColors } from './theme-colors'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('getActiveTheme', () => {
  it("returns 'light' when the root element has no dark class", () => {
    expect(getActiveTheme()).toBe('light')
  })

  it("returns 'dark' when the root element has the dark class", () => {
    document.documentElement.classList.add('dark')
    expect(getActiveTheme()).toBe('dark')
  })
})

describe('getThemeColors', () => {
  it('returns the light palette when not dark', () => {
    expect(getThemeColors()).toBe(THEME_COLORS.light)
  })

  it('returns the dark palette when the dark class is present', () => {
    document.documentElement.classList.add('dark')
    expect(getThemeColors()).toBe(THEME_COLORS.dark)
  })
})

describe('useThemeColors', () => {
  it('initializes from the current DOM state', () => {
    document.documentElement.classList.add('dark')
    const { result, unmount } = renderHook(() => useThemeColors())
    expect(result.current).toBe(THEME_COLORS.dark)
    // Disconnect the MutationObserver before the shared afterEach flips the
    // class again, so that mutation doesn't schedule an update on an
    // unmounted-but-still-observing hook outside of act().
    unmount()
  })

  it('re-renders with the new palette when the dark class is toggled externally', async () => {
    const { result, unmount } = renderHook(() => useThemeColors())
    expect(result.current).toBe(THEME_COLORS.light)

    await act(async () => {
      document.documentElement.classList.add('dark')
      // Let the MutationObserver microtask flush.
      await Promise.resolve()
    })

    expect(result.current).toBe(THEME_COLORS.dark)
    unmount()
  })
})
