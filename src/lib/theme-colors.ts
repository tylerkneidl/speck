import { useEffect, useState } from 'react'

/**
 * Color values for the chart (Recharts) and canvas UI (loupe magnifier) that
 * can't be themed via Tailwind classes because they're consumed as JS string
 * literals — Recharts props and canvas 2D context calls — rather than
 * rendered through CSS.
 */
export const THEME_COLORS = {
  light: {
    chartGrid: '#e6e9ef',
    chartAxisLine: '#d3d9e2',
    chartTick: '#5b6472',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e4e8ee',
    tooltipText: '#5b6472',
    dataLine: '#ff4e22',
    dataValue: '#d63a12',
    fitCurve: '#14b9ab',
    reference: '#c2740a',
    loupeBg: '#f7f8fa',
  },
  dark: {
    chartGrid: '#232a36',
    chartAxisLine: '#3f3f46',
    chartTick: '#8a94a3',
    tooltipBg: '#11141d',
    tooltipBorder: '#232a36',
    tooltipText: '#949fae',
    dataLine: '#ff4e22',
    dataValue: '#ff4e22',
    fitCurve: '#27e0cf',
    reference: '#fbbf24',
    loupeBg: '#090b11',
  },
} as const

export type ThemeColorKey = keyof typeof THEME_COLORS.light

/** Reads the theme straight off the DOM — the source of truth `useTheme` toggles. */
export function getActiveTheme(): 'light' | 'dark' {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light'
}

export function getThemeColors() {
  return THEME_COLORS[getActiveTheme()]
}

/**
 * Reactive palette for components that need JS color values (e.g. Recharts
 * props), not just CSS. `useTheme()` holds its own local state and won't
 * notify other components when the theme changes elsewhere, so this watches
 * the `dark` class on <html> directly via MutationObserver.
 */
export function useThemeColors() {
  const [theme, setTheme] = useState(getActiveTheme)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setTheme(getActiveTheme()))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return THEME_COLORS[theme]
}
