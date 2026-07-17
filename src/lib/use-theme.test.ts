import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, resolveInitialTheme } from './use-theme'

const STORAGE_KEY = 'speck-theme'

function mockOsPrefersDark(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.querySelector('meta[name="theme-color"]')?.remove()
})

describe('resolveInitialTheme', () => {
  it("returns 'dark' when nothing is stored and the OS prefers dark", () => {
    mockOsPrefersDark(true)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it("returns 'light' when nothing is stored and the OS prefers light", () => {
    mockOsPrefersDark(false)
    expect(resolveInitialTheme()).toBe('light')
  })

  it("returns the stored 'light' even when the OS prefers dark", () => {
    mockOsPrefersDark(true)
    localStorage.setItem(STORAGE_KEY, 'light')
    expect(resolveInitialTheme()).toBe('light')
  })

  it("returns the stored 'dark' even when the OS prefers light", () => {
    mockOsPrefersDark(false)
    localStorage.setItem(STORAGE_KEY, 'dark')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('falls back to OS preference when the stored value is not a valid theme', () => {
    mockOsPrefersDark(true)
    localStorage.setItem(STORAGE_KEY, 'not-a-real-theme')
    expect(resolveInitialTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it("adds the 'dark' class to the root element and persists 'dark'", () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it("removes the 'dark' class from the root element and persists 'light'", () => {
    document.documentElement.classList.add('dark')
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('updates an existing theme-color meta tag to match the theme', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#f7f8fa')
    document.head.appendChild(meta)

    applyTheme('dark')
    expect(meta.getAttribute('content')).toBe('#090b11')

    applyTheme('light')
    expect(meta.getAttribute('content')).toBe('#f7f8fa')
  })

  it('does not throw when no theme-color meta tag exists', () => {
    expect(document.querySelector('meta[name="theme-color"]')).toBeNull()
    expect(() => applyTheme('dark')).not.toThrow()
  })
})
