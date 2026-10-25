'use client'

import dynamic from 'next/dynamic'

// Canvas and requestAnimationFrame: browser only.
export const LinearMotionClient = dynamic(
  () =>
    import('@/features/sims/linear-motion/LinearMotionNotebook').then(
      (m) => m.LinearMotionNotebook,
    ),
  { ssr: false },
)
