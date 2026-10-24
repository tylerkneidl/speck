import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Db = PostgresJsDatabase<typeof schema>

function connect(): Db {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return drizzle(postgres(connectionString), { schema })
}

let instance: Db | null = null

/**
 * Connects on first use rather than on import: `next build` loads the API
 * route module to read its config, and there's no database at build time.
 */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    instance ??= connect()
    const value = Reflect.get(instance, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export * from './schema'
