import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate as runMigrations } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { logger } from '../lib/logger'

/**
 * Applies pending Drizzle migrations, then exits.
 *
 * Wired as Railway's `preDeployCommand`, so it runs once per deploy — after the
 * build, before the new version takes traffic — and a failed migration aborts
 * the deploy instead of shipping code against the wrong schema.
 *
 * Uses drizzle-orm's migrator (a prod dependency) rather than the drizzle-kit
 * CLI, which is dev-only and wouldn't exist if dev deps were pruned. Applied
 * migrations are tracked in `__drizzle_migrations`, so this is a safe no-op
 * when the schema is already current.
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  logger.error('DATABASE_URL is not set — cannot run migrations')
  process.exit(1)
}

// max: 1 — migrations must run serially on a single connection.
const client = postgres(connectionString, { max: 1 })

try {
  await runMigrations(drizzle(client), { migrationsFolder: './drizzle' })
  logger.info('Migrations up to date')
} catch (err) {
  logger.error({ err }, 'Migration failed — aborting deploy')
  process.exitCode = 1
} finally {
  await client.end()
}
