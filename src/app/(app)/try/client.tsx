'use client'

import dynamic from 'next/dynamic'

// The workspace touches video, canvas and localStorage as it mounts: browser only.
export const TryClient = dynamic(() => import('./try-screen').then((m) => m.TryPage), {
  ssr: false,
})
