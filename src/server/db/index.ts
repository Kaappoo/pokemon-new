import { makeNeonDatabase, makePgliteDatabase } from './client.ts'

/**
 * Process-wide connection shared by better-auth and the Effect runtime.
 * Neon when DATABASE_URL is set (production, or a Neon dev branch), otherwise
 * a local in-process Postgres persisted in ./.pglite (run `pnpm db:migrate` first).
 */
export const database = process.env.DATABASE_URL
  ? makeNeonDatabase(process.env.DATABASE_URL)
  : await makePgliteDatabase(process.env.PGLITE_DIR ?? '.pglite')
