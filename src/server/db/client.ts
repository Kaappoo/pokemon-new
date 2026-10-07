import { Pool } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { Context, Effect, Layer } from 'effect'
import { DatabaseError } from '../errors.ts'
import * as schema from './schema.ts'

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>

export const MIGRATIONS_FOLDER = 'drizzle'

/** Neon over WebSockets (Node 22 ships a global WebSocket, so no `ws` shim is needed). */
export const makeNeonDatabase = (url: string): Database =>
  drizzleNeon({ client: new Pool({ connectionString: url }), schema }) as unknown as Database

/*
 * PGlite is real Postgres compiled to WASM, running in-process. It stands in
 * for Neon wherever there is no DATABASE_URL: local dev (persisted to a
 * folder), tests and e2e (in memory or a scratch folder). The specifiers are
 * opaque on purpose so the production server bundle never includes it.
 */
const PGLITE = '@electric-sql/pglite'
const DRIZZLE_PGLITE = 'drizzle-orm/pglite'
const PGLITE_MIGRATOR = 'drizzle-orm/pglite/migrator'

export const makePgliteDatabase = async (dataDir?: string): Promise<Database> => {
  const [{ PGlite }, { drizzle }] = (await Promise.all([
    import(/* @vite-ignore */ PGLITE),
    import(/* @vite-ignore */ DRIZZLE_PGLITE),
  ])) as [typeof import('@electric-sql/pglite'), typeof import('drizzle-orm/pglite')]
  return drizzle({ client: new PGlite(dataDir), schema }) as unknown as Database
}

export const migratePglite = async (database: Database, migrationsFolder = MIGRATIONS_FOLDER) => {
  const { migrate } = (await import(/* @vite-ignore */ PGLITE_MIGRATOR)) as typeof import('drizzle-orm/pglite/migrator')
  await migrate(database as never, { migrationsFolder })
}

export class Db extends Context.Service<
  Db,
  {
    readonly drizzle: Database
    query<A>(run: (db: Database) => Promise<A>): Effect.Effect<A, DatabaseError>
  }
>()('pokemon-new/server/db/Db') {
  static readonly make = (database: Database) =>
    Db.of({
      drizzle: database,
      query: (run) =>
        Effect.tryPromise({
          try: () => run(database),
          catch: (cause) => new DatabaseError({ cause }),
        }),
    })

  static readonly fromDatabase = (database: Database) => Layer.succeed(Db, Db.make(database))

  /** Fresh, migrated in-memory Postgres per layer build — isolated and fast enough for tests. */
  static readonly layerTest = Layer.effect(
    Db,
    Effect.promise(async () => {
      const database = await makePgliteDatabase()
      await migratePglite(database)
      return Db.make(database)
    }),
  )
}
