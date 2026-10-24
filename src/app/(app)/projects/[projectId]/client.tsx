'use client'

import dynamic from 'next/dynamic'

// The editor touches video, canvas and localStorage as it mounts: browser only.
export const ProjectEditorClient = dynamic(
  () => import('./editor-screen').then((m) => m.ProjectEditor),
  { ssr: false },
)
