import './env.ts'
import { Cause, Effect, Exit, Layer } from 'effect'
import { syncCatalog } from '../src/server/catalog/sync.ts'
import { Db, makeNeonDatabase, makePgliteDatabase } from '../src/server/db/client.ts'
import { Tcgdex } from '../src/server/tcgdex/client.ts'

/**
 * Syncs the card catalog from TCGdex into the database.
 *
 *   pnpm sync                    # everything (first run takes a while: every card is enriched)
 *   pnpm sync --enrich-limit=200 # cap card enrichment, handy for a quick local catalog
 *
 * Uses the direct (non-pooled) connection when available: the sync writes
 * concurrently, which pooled connections handle poorly.
 */
const limitArg = process.argv.find((arg) => arg.startsWith('--enrich-limit='))
const enrichLimit = limitArg ? Number(limitArg.split('=')[1]) : undefined

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
const database = url ? makeNeonDatabase(url) : await makePgliteDatabase(process.env.PGLITE_DIR ?? '.pglite')

const exit = await Effect.runPromiseExit(
  syncCatalog({ enrichLimit }).pipe(Effect.provide(Layer.mergeAll(Db.fromDatabase(database), Tcgdex.layer))),
)

if (Exit.isSuccess(exit)) {
  const report = exit.value
  console.log(`✓ catalog sync complete: ${report.sets} sets, ${report.cards} cards, ${report.enriched} enriched`)
  process.exit(0)
}
console.error(`✗ catalog sync failed\n${Cause.pretty(exit.cause)}`)
process.exit(1)
