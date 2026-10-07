import './env.ts'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { MIGRATIONS_FOLDER, makePgliteDatabase, migratePglite } from '../src/server/db/client.ts'

// Migrations go over the direct (non-pooled) connection when one is available.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (url) {
  const pool = new Pool({ connectionString: url })
  await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS_FOLDER })
  await pool.end()
  console.log(`✓ migrations applied to ${new URL(url).host}`)
} else if (process.env.VERCEL) {
  // A Vercel build without a database would otherwise "migrate" a throwaway local folder and pass.
  console.error('✗ DATABASE_URL is not set for this Vercel deployment. Add it under Project → Settings → Environment Variables.')
  process.exit(1)
} else {
  const dir = process.env.PGLITE_DIR ?? '.pglite'
  await migratePglite(await makePgliteDatabase(dir))
  console.log(`✓ migrations applied to local Postgres in ./${dir}`)
}
