import app from '@/server/app'
import { handle } from 'hono/vercel'

// Every /api/* request goes to the Hono app unchanged: its routes, Clerk
// middleware and logging are the same ones the old standalone server ran.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = handle(app)

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
}
