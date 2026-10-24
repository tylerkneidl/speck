import type { ReactNode } from 'react'

// Public marketing pages. This is the ONLY layout where marketing analytics and
// ad pixels may ever load — never in (app), which students reach.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children
}
