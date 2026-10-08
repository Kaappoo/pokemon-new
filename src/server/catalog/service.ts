import { and, asc, count, desc, eq, exists, ilike, inArray, ne, sql, type SQL } from 'drizzle-orm'
import { Clock, Context, Effect, Layer, Option, Schema } from 'effect'
import { normalizeCardNumber } from '#/domain/catalog.ts'
import { TcgdexCard } from '#/domain/tcgdex.ts'
import type { CardSearchInput } from '#/shared/schemas.ts'
import { Db } from '../db/client.ts'
import { cards, series, sets } from '../db/schema.ts'
import { NotFound } from '../errors.ts'
import { Tcgdex } from '../tcgdex/client.ts'
import { enrichedColumns, likeContains, localIdOrder } from './rows.ts'

export interface SetSummary {
  readonly id: string
  readonly name: string
  readonly logo: string | null
  readonly symbol: string | null
  readonly serieId: string
  readonly serieName: string
  readonly releaseDate: string | null
  readonly official: number
  readonly total: number
  readonly isPocket: boolean
}

export interface CardSummary {
  readonly id: string
  readonly localId: string
  readonly name: string
  readonly image: string | null
  readonly setId: string
  readonly setName: string
}

export interface CardPage {
  readonly cards: ReadonlyArray<CardSummary>
  readonly total: number
  readonly page: number
  readonly perPage: number
  readonly nextPage: number | null
}

export interface SetDetail {
  readonly set: SetSummary
  readonly cards: ReadonlyArray<CardSummary>
}

export interface CardView {
  readonly card: CardSummary & {
    readonly category: string | null
    readonly rarity: string | null
    readonly hp: number | null
    readonly types: ReadonlyArray<string>
  }
  readonly set: SetSummary
  /** Full TCGdex detail (attacks, weaknesses, legality…). Null if TCGdex could not be reached for an un-enriched card. */
  readonly detail: TcgdexCard | null
}

export interface LiveCardRef {
  readonly setCode: string
  readonly number: string
}

export interface LiveCardMatch extends LiveCardRef {
  readonly id: string
  readonly name: string
  /** TCGdex image base URL, null when the art isn't published yet. */
  readonly image: string | null
}

export interface CatalogHome {
  readonly stats: { readonly sets: number; readonly cards: number }
  readonly latest: SetSummary | null
  readonly latestCards: ReadonlyArray<CardSummary>
}

const setColumns = {
  id: sets.id,
  name: sets.name,
  logo: sets.logo,
  symbol: sets.symbol,
  serieId: sets.serieId,
  serieName: series.name,
  releaseDate: sets.releaseDate,
  official: sets.cardCountOfficial,
  total: sets.cardCountTotal,
  isPocket: sets.isPocket,
}

const cardColumns = {
  id: cards.id,
  localId: cards.localId,
  name: cards.name,
  image: cards.image,
  setId: cards.setId,
  setName: sets.name,
}

type SetRowShape = { [K in keyof typeof setColumns]: (typeof setColumns)[K]['_']['data'] | null }

const toSetSummary = (row: SetRowShape): SetSummary => ({
  id: row.id!,
  name: row.name!,
  logo: row.logo || null,
  symbol: row.symbol || null,
  serieId: row.serieId!,
  serieName: row.serieName!,
  releaseDate: row.releaseDate || null,
  official: row.official ?? 0,
  total: row.total ?? 0,
  isPocket: row.isPocket ?? false,
})

const toCardSummary = (row: { [K in keyof typeof cardColumns]: string | null }): CardSummary => ({
  id: row.id!,
  localId: row.localId!,
  name: row.name!,
  image: row.image || null,
  setId: row.setId!,
  setName: row.setName ?? '',
})

const hasImage = sql`coalesce(${cards.image}, '') <> ''`
const decodeCard = Schema.decodeUnknownOption(TcgdexCard)

const make = Effect.gen(function* () {
  const db = yield* Db
  const tcgdex = yield* Tcgdex

  const listSets = Effect.fn('CatalogService.listSets')(function* (input: { includePocket: boolean }) {
    const rows = yield* db.query((d) =>
      d
        .select(setColumns)
        .from(sets)
        .innerJoin(series, eq(series.id, sets.serieId))
        .where(input.includePocket ? undefined : eq(sets.isPocket, false))
        .orderBy(desc(sets.releaseDate), desc(sets.id)),
    )
    return rows.map(toSetSummary)
  })

  const findSet = (setId: string) =>
    db
      .query((d) =>
        d.select(setColumns).from(sets).innerJoin(series, eq(series.id, sets.serieId)).where(eq(sets.id, setId)).limit(1),
      )
      .pipe(Effect.map((rows) => (rows[0] ? toSetSummary(rows[0]) : null)))

  const getSet = Effect.fn('CatalogService.getSet')(function* (setId: string) {
    const set = yield* findSet(setId)
    if (!set) return yield* new NotFound({ entity: 'Set', id: setId })
    const rows = yield* db.query((d) =>
      d
        .select(cardColumns)
        .from(cards)
        .innerJoin(sets, eq(sets.id, cards.setId))
        .where(eq(cards.setId, setId))
        .orderBy(...localIdOrder),
    )
    return { set, cards: rows.map(toCardSummary) } satisfies SetDetail
  })

  const searchCards = Effect.fn('CatalogService.searchCards')(function* (input: CardSearchInput) {
    const conditions: Array<SQL | undefined> = [
      // Cards whose art TCGdex hasn't published yet would only show as blanks in the grid.
      hasImage,
      input.includePocket ? undefined : eq(cards.isPocket, false),
      input.q ? ilike(cards.name, likeContains(input.q)) : undefined,
      input.set ? eq(cards.setId, input.set) : undefined,
      input.category ? eq(cards.category, input.category) : undefined,
      input.type ? sql`${input.type} = any(${cards.types})` : undefined,
    ]
    const where = and(...conditions)
    const offset = (input.page - 1) * input.perPage

    const [rows, [totalRow]] = yield* Effect.all(
      [
        db.query((d) =>
          d
            .select(cardColumns)
            .from(cards)
            .innerJoin(sets, eq(sets.id, cards.setId))
            .where(where)
            .orderBy(desc(sets.releaseDate), asc(sets.id), ...localIdOrder)
            .limit(input.perPage)
            .offset(offset),
        ),
        db.query((d) => d.select({ total: count() }).from(cards).where(where)),
      ],
      { concurrency: 'unbounded' },
    )

    const total = totalRow?.total ?? 0
    return {
      cards: rows.map(toCardSummary),
      total,
      page: input.page,
      perPage: input.perPage,
      nextPage: offset + rows.length < total ? input.page + 1 : null,
    } satisfies CardPage
  })

  const getCard = Effect.fn('CatalogService.getCard')(function* (cardId: string) {
    const [row] = yield* db.query((d) =>
      d
        .select({
          card: {
            ...cardColumns,
            category: cards.category,
            rarity: cards.rarity,
            hp: cards.hp,
            types: cards.types,
            rawData: cards.rawData,
          },
          set: setColumns,
        })
        .from(cards)
        .innerJoin(sets, eq(sets.id, cards.setId))
        .innerJoin(series, eq(series.id, sets.serieId))
        .where(eq(cards.id, cardId))
        .limit(1),
    )
    if (!row) return yield* new NotFound({ entity: 'Card', id: cardId })

    let detail = Option.getOrNull(decodeCard(row.card.rawData))
    if (!detail) {
      // Not enriched yet (a brand-new card the nightly sync hasn't reached): fetch it now and keep it.
      const live = yield* tcgdex.getCard(cardId).pipe(Effect.option)
      if (Option.isSome(live)) {
        detail = live.value.value
        const now = new Date(yield* Clock.currentTimeMillis)
        const enriched = enrichedColumns(detail, live.value.raw, now)
        yield* db.query((d) => d.update(cards).set(enriched).where(eq(cards.id, cardId)))
        Object.assign(row.card, enriched)
      }
    }

    return {
      card: {
        ...toCardSummary(row.card),
        category: row.card.category,
        rarity: row.card.rarity,
        hp: row.card.hp,
        types: row.card.types ?? [],
      },
      set: toSetSummary(row.set),
      detail,
    } satisfies CardView
  })

  const types = Effect.fn('CatalogService.types')(function* () {
    const rows = yield* db.query((d) =>
      d
        .selectDistinct({ type: sql<string>`unnest(${cards.types})` })
        .from(cards)
        .where(eq(cards.isPocket, false))
        .orderBy(sql`1`),
    )
    return rows.map((r) => r.type)
  })

  const home = Effect.fn('CatalogService.home')(function* () {
    const physical = eq(sets.isPocket, false)
    const [[setCount], [cardCount], [latestRow]] = yield* Effect.all(
      [
        db.query((d) => d.select({ n: count() }).from(sets).where(physical)),
        db.query((d) => d.select({ n: count() }).from(cards).where(eq(cards.isPocket, false))),
        db.query((d) =>
          d
            .select(setColumns)
            .from(sets)
            .innerJoin(series, eq(series.id, sets.serieId))
            .where(
              and(
                physical,
                ne(sets.releaseDate, ''),
                exists(d.select({ one: sql`1` }).from(cards).where(and(eq(cards.setId, sets.id), hasImage))),
              ),
            )
            .orderBy(desc(sets.releaseDate))
            .limit(1),
        ),
      ],
      { concurrency: 'unbounded' },
    )

    const latest = latestRow ? toSetSummary(latestRow) : null
    const latestCards = latest
      ? (yield* db.query((d) =>
          d
            .select(cardColumns)
            .from(cards)
            .innerJoin(sets, eq(sets.id, cards.setId))
            .where(and(eq(cards.setId, latest.id), hasImage))
            .orderBy(...localIdOrder)
            .limit(18),
        )).map(toCardSummary)
      : []

    return {
      stats: { sets: setCount?.n ?? 0, cards: cardCount?.n ?? 0 },
      latest,
      latestCards,
    } satisfies CatalogHome
  })

  /**
   * Resolves Pokémon TCG Live deck-list references ("TWM 130") to catalog
   * cards. Unknown references are left out. When a code and number match more
   * than one card (a code shared by a main set and its subset), the one with
   * art from the newest set wins.
   */
  const lookupLiveCards = Effect.fn('CatalogService.lookupLiveCards')(function* (refs: ReadonlyArray<LiveCardRef>) {
    const wanted = refs.map((ref) => ({ ...ref, code: ref.setCode.trim().toUpperCase(), num: normalizeCardNumber(ref.number) }))
    const codes = [...new Set(wanted.map((w) => w.code))]
    const numbers = [...new Set(wanted.map((w) => w.num))]
    if (codes.length === 0) return []

    const normalizedLocalId = sql<string>`regexp_replace(upper(${cards.localId}), '^0+(?=[0-9])', '')`
    const rows = yield* db.query((d) =>
      d
        .select({ id: cards.id, name: cards.name, image: cards.image, code: sets.liveCode, num: normalizedLocalId })
        .from(cards)
        .innerJoin(sets, eq(sets.id, cards.setId))
        .where(and(inArray(sets.liveCode, codes), inArray(normalizedLocalId, numbers), eq(sets.isPocket, false)))
        .orderBy(sql`(coalesce(${cards.image}, '') <> '') desc`, desc(sets.releaseDate), asc(cards.id)),
    )

    const best = new Map<string, (typeof rows)[number]>()
    for (const row of rows) {
      const key = `${row.code} ${row.num}`
      if (!best.has(key)) best.set(key, row)
    }
    return wanted.flatMap((w): Array<LiveCardMatch> => {
      const row = best.get(`${w.code} ${w.num}`)
      return row ? [{ setCode: w.setCode, number: w.number, id: row.id, name: row.name, image: row.image || null }] : []
    })
  })

  return { listSets, getSet, searchCards, getCard, types, home, lookupLiveCards }
})

export class CatalogService extends Context.Service<CatalogService, Effect.Success<typeof make>>()(
  'pokemon-new/server/catalog/CatalogService',
) {
  static readonly layer = Layer.effect(CatalogService, make)
}
