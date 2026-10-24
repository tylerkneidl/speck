import { Suspense } from 'react'
import { LabBenchPage } from './bench-screen'

export default async function Page({ params }: { params: Promise<{ labSlug: string }> }) {
  const { labSlug } = await params
  // The bench reads its settings from the query string (useSearchParams).
  return (
    <Suspense>
      <LabBenchPage labSlug={labSlug} />
    </Suspense>
  )
}
