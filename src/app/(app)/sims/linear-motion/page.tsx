import type { Metadata } from 'next'
import { LinearMotionClient } from './client'

export const metadata: Metadata = {
  title: 'Linear motion sim — Speck',
  description:
    'A toy car on a straight track, drawn like a lab notebook. Explore position, velocity and acceleration.',
  // Unlisted until the sim is finished (plan Phase 7).
  robots: { index: false, follow: false },
}

export default function Page() {
  return <LinearMotionClient />
}
