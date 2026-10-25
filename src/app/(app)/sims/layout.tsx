import type { ReactNode } from 'react'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/700.css'
import '@fontsource/patrick-hand'

// Sims draw in a lab-notebook hand. The faces load here so the rest of the app never pays for them.
export default function SimsLayout({ children }: { children: ReactNode }) {
  return children
}
