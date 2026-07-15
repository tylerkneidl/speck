import { useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'speck-theme'
const THEME_COLOR: Record<Theme, string> = {
  light: '#f7f8fa',
  dark: '#090b11',
}

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Resolves the theme to use on first load: a valid stored preference wins,
 * otherwise falls back to the OS-level `prefers-color-scheme`.
 */
export function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isTheme(stored)) return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Applies a theme to the document: toggles the `dark` class Tailwind keys
 * off of, persists the choice, and keeps the mobile browser chrome
 * (`theme-color`) in sync if that meta tag is present.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)

  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLOR[theme])
}

/**
 * Thin reactive wrapper around resolveInitialTheme/applyTheme for components.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme)

  const setTheme = (next: Theme) => {
    applyTheme(next)
    setThemeState(next)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
