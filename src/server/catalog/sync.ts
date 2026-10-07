import { asc, eq, isNull, sql } from 'drizzle-orm'
import { Clock, Effect, Ref, Result, Schema } from 'effect'
import { isPocketSerie } from '#/domain/catalog.ts'
import { Db } from '../db/client.ts'
import { cards, series, sets } from '../db/schema.ts'
import { Tcgdex } from '../tcgdex/client.ts'
import { enrichedColumns } from './rows.ts'

export class SyncFailed extends Schema.TaggedError<SyncFailed>()('SyncFailed', {
  reason: Schema.String,
}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return this.reason
  }
}

export interface SyncReport {
  readonly sets: number
  readonly cards: number
  readonly setFailures: ReadonlyArray<string>
  readonly enriched: number
  readonly enrichFailures: ReadonlyArray<string>
}

/**
 * A few failures (a card TCGdex briefly 404s, a network blip) are normal; the
 * next run retries them. Above this rate something systemic is wrong and the
 * run fails loudly instead of leaving a half-written catalog behind.
 */
export const MAX_FAILURE_RATE = 0.05
const CONCURRENCY = 8
const CARD_BATCH = 400

const failureRate = (failed: number, total: number) => (total === 0 ? 0 : failed / total)

/**
 * Pulls every set from TCGdex and upserts series, sets and cards, then fills
 * in full details for any card that doesn't have them yet. Safe to run again
 * and again: enriched cards are skipped, so nightly runs only touch what's new.
 */
export const syncCatalog = Effect.fn('CatalogSync.run')(function* (options: { readonly enrichLimit?: number } = {}) {
  const db = yield* Db
  const tcgdex = yield* Tcgdex

  const resumes = yield* tcgdex.listSets()
  yield* Effect.logInfo(`TCGdex lists ${resumes.length} sets`)

  const syncSet = Effect.fn('CatalogSync.syncSet')(function* (setId: string) {
    const { value: set, raw } = yield* tcgdex.getSet(setId)
    const now = new Date(yield* Clock.currentTimeMillis)
    const isPocket = isPocketSerie(set.serie.id)

    yield* db.query((d) =>
      d
        .insert(series)
        .values({ id: set.serie.id, name: set.serie.name })
        .onConflictDoUpdate({ target: series.id, set: { name: set.serie.name } }),
    )

    const setRow = {
      name: set.name,
      logo: set.logo ?? '',
      symbol: set.symbol ?? '',
      serieId: set.serie.id,
      releaseDate: set.releaseDate ?? '',
      cardCountTotal: set.cardCount?.total ?? 0,
      cardCountOfficial: set.cardCount?.official ?? 0,
      isPocket,
      rawData: raw,
      updatedAt: now,
    }
    yield* db.query((d) =>
      d
        .insert(sets)
        .values({ id: set.id, ...setRow })
        .onConflictDoUpdate({ target: sets.id, set: setRow }),
    )

    // One statement per batch instead of one round trip per card.
    for (let i = 0; i < set.cards.length; i += CARD_BATCH) {
      const batch = set.cards.slice(i, i + CARD_BATCH).map((card) => ({
        id: card.id,
        localId: card.localId,
        name: card.name,
        image: card.image ?? '',
        setId: set.id,
        isPocket,
        updatedAt: now,
      }))
      yield* db.query((d) =>
        d
          .insert(cards)
          .values(batch)
          .onConflictDoUpdate({
            target: cards.id,
            set: {
              localId: sql`excluded.local_id`,
              name: sql`excluded.name`,
              image: sql`excluded.image`,
              setId: sql`excluded.set_id`,
              isPocket: sql`excluded.is_pocket`,
              // New sets often go live before their art: once an image appears,
              // drop the stale detail so the card is re-enriched with it.
              rawData: sql`case when coalesce(${cards.image}, '') is distinct from excluded.image then null else ${cards.rawData} end`,
              updatedAt: now,
            },
          }),
      )
    }
    return set.cards.length
  })

  const setResults = yield* Effect.forEach(
    resumes,
    (resume) => syncSet(resume.id).pipe(Effect.result, Effect.map((result) => ({ id: resume.id, result }))),
    { concurrency: CONCURRENCY },
  )

  const setFailures = setResults.flatMap(({ id, result }) =>
    Result.isFailure(result) ? [`${id}: ${result.failure.message}`] : [],
  )
  const cardTotal = setResults.reduce((sum, { result }) => sum + (Result.isSuccess(result) ? result.success : 0), 0)
  yield* Effect.logInfo(
    `synced ${resumes.length - setFailures.length}/${resumes.length} sets, ${cardTotal} cards (${setFailures.length} failed)`,
  )
  for (const failure of setFailures.slice(0, 20)) yield* Effect.logWarning(failure)

  if (failureRate(setFailures.length, resumes.length) > MAX_FAILURE_RATE) {
    return yield* new SyncFailed({
      reason: `${setFailures.length}/${resumes.length} sets failed to sync - TCGdex or the database is having problems`,
    })
  }

  const pending = yield* db.query((d) => {
    const query = d
      .select({ id: cards.id })
      .from(cards)
      .where(isNull(cards.rawData))
      // Physical-TCG cards first so a limited run spends its budget on what most people browse.
      .orderBy(asc(cards.isPocket), asc(cards.id))
    return options.enrichLimit ? query.limit(options.enrichLimit) : query
  })
  yield* Effect.logInfo(`enriching ${pending.length} cards with full detail`)

  const progress = yield* Ref.make(0)
  const enrichResults = yield* Effect.forEach(
    pending,
    ({ id }) =>
      Effect.gen(function* () {
        const { value: card, raw } = yield* tcgdex.getCard(id)
        const now = new Date(yield* Clock.currentTimeMillis)
        yield* db.query((d) => d.update(cards).set(enrichedColumns(card, raw, now)).where(eq(cards.id, id)))
        const done = yield* Ref.updateAndGet(progress, (n) => n + 1)
        if (done % 500 === 0) yield* Effect.logInfo(`  …${done}/${pending.length}`)
      }).pipe(Effect.result, Effect.map((result) => ({ id, result }))),
    { concurrency: CONCURRENCY },
  )

  const enrichFailures = enrichResults.flatMap(({ id, result }) =>
    Result.isFailure(result) ? [`${id}: ${result.failure.message}`] : [],
  )
  yield* Effect.logInfo(`enriched ${pending.length - enrichFailures.length}/${pending.length} cards`)
  for (const failure of enrichFailures.slice(0, 20)) yield* Effect.logWarning(failure)

  if (failureRate(enrichFailures.length, pending.length) > MAX_FAILURE_RATE) {
    return yield* new SyncFailed({
      reason: `${enrichFailures.length}/${pending.length} cards failed to enrich - TCGdex or the database is having problems`,
    })
  }

  return {
    sets: resumes.length - setFailures.length,
    cards: cardTotal,
    setFailures,
    enriched: pending.length - enrichFailures.length,
    enrichFailures,
  } satisfies SyncReport
})
