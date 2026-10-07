import { describe, expect, it } from '@effect/vitest'
import { eq } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { cardSearchInput } from '#/shared/schemas.ts'
import { Db } from '../db/client.ts'
import { cards } from '../db/schema.ts'
import { seedCatalog, tcgdexTest } from '../testing.ts'
import { CatalogService } from './service.ts'

const TestLayer = CatalogService.layer.pipe(Layer.provideMerge(Layer.mergeAll(Db.layerTest, tcgdexTest())))
const search = (input: Partial<Parameters<typeof cardSearchInput.parse>[0]> = {}) => cardSearchInput.parse(input)

describe('CatalogService', () => {
  it.effect('lists physical sets newest first and hides Pokémon TCG Pocket unless asked', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const catalog = yield* CatalogService
      expect((yield* catalog.listSets({ includePocket: false })).map((s) => s.id)).toEqual(['sv01', 'base1'])
      expect((yield* catalog.listSets({ includePocket: true })).map((s) => s.id)).toEqual(['A1', 'sv01', 'base1'])
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('searches cards by name, set, type and Pocket, skipping cards without art', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const catalog = yield* CatalogService
      const names = (page: { cards: ReadonlyArray<{ name: string }> }) => page.cards.map((c) => c.name)

      expect(names(yield* catalog.searchCards(search()))).toEqual(['Pineco', 'Charizard', 'Mewtwo', 'Pikachu'])
      expect(names(yield* catalog.searchCards(search({ q: 'char' })))).toEqual(['Charizard'])
      expect(names(yield* catalog.searchCards(search({ type: 'Fire' })))).toEqual(['Charizard'])
      expect(names(yield* catalog.searchCards(search({ set: 'base1' })))).toEqual(['Charizard', 'Mewtwo', 'Pikachu'])
      expect(names(yield* catalog.searchCards(search({ q: 'bulba' })))).toEqual([])
      expect(names(yield* catalog.searchCards(search({ q: 'bulba', includePocket: true })))).toEqual(['Bulbasaur'])
      expect(names(yield* catalog.searchCards(search({ q: '%' })))).toEqual([])
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('pages through results', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const catalog = yield* CatalogService
      const first = yield* catalog.searchCards(search({ perPage: 3 }))
      expect(first).toMatchObject({ total: 4, nextPage: 2 })
      const second = yield* catalog.searchCards(search({ perPage: 3, page: 2 }))
      expect(second).toMatchObject({ nextPage: null })
      expect(second.cards).toHaveLength(1)
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('lists a set in printed order, including cards still waiting for art', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const catalog = yield* CatalogService
      const base = yield* catalog.getSet('base1')
      expect(base.cards.map((c) => c.localId)).toEqual(['4', '10', '58'])
      const sv = yield* catalog.getSet('sv01')
      expect(sv.cards.map((c) => c.image)).toEqual(['https://assets.tcgdex.net/en/sv/sv01/001', null])
      expect((yield* Effect.flip(catalog.getSet('nope')))._tag).toBe('NotFound')
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('fetches and keeps full detail for a card that has not been enriched yet', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const catalog = yield* CatalogService
      const view = yield* catalog.getCard('base1-4')
      expect(view.detail).toMatchObject({ name: 'Charizard', hp: 60 })
      expect(view.set).toMatchObject({ id: 'base1', official: 102 })

      const db = yield* Db
      const [stored] = yield* db.query((d) => d.select({ raw: cards.rawData }).from(cards).where(eq(cards.id, 'base1-4')))
      expect(stored?.raw).toMatchObject({ id: 'base1-4' })
      expect((yield* Effect.flip(catalog.getCard('base1-999')))._tag).toBe('NotFound')
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('summarises the catalog for the landing page', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const home = yield* (yield* CatalogService).home()
      expect(home.stats).toEqual({ sets: 2, cards: 5 })
      expect(home.latest?.id).toBe('sv01')
      expect(home.latestCards.map((c) => c.name)).toEqual(['Pineco'])
    }).pipe(Effect.provide(TestLayer)),
  )
})
