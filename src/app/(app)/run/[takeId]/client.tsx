'use client'

import dynamic from 'next/dynamic'

// The workspace touches video, canvas and localStorage as it mounts: browser only.
export const RunTakeClient = dynamic(() => import('./run-screen').then((m) => m.RunTakePage), {
  ssr: false,
})
