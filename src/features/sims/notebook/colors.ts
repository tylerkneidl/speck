import { useActiveTheme } from '@/lib/theme-colors'

/**
 * The notebook's palettes. Canvas can't read CSS classes, so sims draw with these. Light is graph
 * paper in blue-black pen; dark is a blueprint in white and pale cyan. The red pen (targets,
 * velocity arrows, teacher notes) stays red in both.
 */
export const NOTEBOOK_COLORS = {
  light: {
    page: '#fcfdfb',
    gridMinor: '#dbe7f0',
    gridMajor: '#b8cfe0',
    marginRule: '#e9a9a4',
    ink: '#1e2b4d',
    inkSoft: '#4a5779',
    pencil: '#7d838e',
    redPen: '#c2362b',
    sticky: '#fff3a8',
    plotFill: 'rgba(252, 253, 251, 0.9)',
    carBody: 'rgba(194, 54, 43, 0.55)',
    carGlass: 'rgba(120, 170, 210, 0.45)',
    ruler: 'rgba(240, 200, 90, 0.35)',
  },
  dark: {
    page: '#123a63',
    gridMinor: '#1d4a77',
    gridMajor: '#2d6296',
    marginRule: '#5b8fc2',
    ink: '#eef6ff',
    inkSoft: '#a9cdee',
    pencil: '#8fb4d6',
    redPen: '#ff7a6b',
    sticky: '#f5e27a',
    plotFill: 'rgba(18, 58, 99, 0.85)',
    carBody: 'rgba(255, 122, 107, 0.45)',
    carGlass: 'rgba(169, 205, 238, 0.35)',
    ruler: 'rgba(169, 205, 238, 0.18)',
  },
} as const

export type NotebookColors = (typeof NOTEBOOK_COLORS)[keyof typeof NOTEBOOK_COLORS]

/** The notebook palette for the active theme, kept current when the theme toggles. */
export function useNotebookColors(): NotebookColors {
  return NOTEBOOK_COLORS[useActiveTheme()]
}

/** Canvas font stacks. The handwriting faces load in the sims layout. */
export const NOTEBOOK_FONTS = {
  hand: '"Caveat", "Patrick Hand", cursive',
  label: '"Patrick Hand", "Caveat", cursive',
  mono: '"JetBrains Mono Variable", ui-monospace, monospace',
} as const
