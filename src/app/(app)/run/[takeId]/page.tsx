import { RunTakeClient } from './client'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ takeId: string }>
  searchParams: Promise<{ calibrated?: string }>
}) {
  const { takeId } = await params
  const { calibrated } = await searchParams
  return <RunTakeClient takeId={takeId} calibrated={calibrated === 'true'} />
}
