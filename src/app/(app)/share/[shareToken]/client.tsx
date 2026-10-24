'use client'

import dynamic from 'next/dynamic'

// The workspace touches video, canvas and localStorage as it mounts: browser only.
export const SharedProjectClient = dynamic(
  () => import('./share-screen').then((m) => m.SharedProject),
  { ssr: false },
)
