import type { Metadata } from 'next'
import { SharedProjectClient } from './client'

// Share links are private by convention: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params
  return <SharedProjectClient shareToken={shareToken} />
}
