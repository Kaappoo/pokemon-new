import { describe, expect, it } from '@effect/vitest'
import { eq, isNull } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { Db } from '../db/client.ts'
import { cards, sets } from '../db/schema.ts'
import { fakeSets, tcgdexTest } from '../testing.ts'
import { syncCatalog } from './sync.ts'

const layer = (options?: Parameters<typeof tcgdexTest>[0]) => Layer.mergeAll(Db.layerTest, tcgdexTest(options))

describe('syncCatalog', () => {
  it.effect('writes every set and card, flags Pocket, and enriches cards', () =>
    Effect.gen(function* () {
      const report = yield* syncCatalog()
      expect(report).toMatchObject({ sets: 3, cards: 6, enriched: 6, setFailures: [], enrichFailures: [] })

      const db = yield* Db
      const pocket = yield* db.query((d) => d.select({ id: sets.id }).from(sets).where(eq(sets.isPocket, true)))
      expect(pocket).toEqual([{ id: 'A1' }])

      const [charizard] = yield* db.query((d) => d.select().from(cards).where(eq(cards.id, 'base1-4')))
      expect(charizard).toMatchObject({ name: 'Charizard', category: 'Pokemon', types: ['Fire'], isPocket: false })
      expect(charizard?.rawData).toMatchObject({ id: 'base1-4' })
    }).pipe(Effect.provide(layer())),
  )

  it.effect('is safe to run again and only re-enriches cards whose art was just published', () =>
    Effect.gen(function* () {
      yield* syncCatalog()
      const db = yield* Db

      // Second run with nothing new: no card needs enrichment.
      expect((yield* syncCatalog()).enriched).toBe(0)

      // TCGdex publishes the missing art for Forretress ex.
      const sv01 = fakeSets.sv01!
      const original = sv01.cards
      ;(sv01 as { cards: typeof original }).cards = original.map((c) =>
        c.id === 'sv01-002' ? { ...c, image: 'https://assets.tcgdex.net/en/sv/sv01/002' } : c,
      )
      try {
        const report = yield* syncCatalog()
        expect(report.enriched).toBe(1)
        const [card] = yield* db.query((d) => d.select().from(cards).where(eq(cards.id, 'sv01-002')))
        expect(card?.image).toBe('https://assets.tcgdex.net/en/sv/sv01/002')
        expect(card?.rawData).not.toBeNull()
      } finally {
        ;(sv01 as { cards: typeof original }).cards = original
      }
    }).pipe(Effect.provide(layer())),
  )

  it.effect('leaves a card that failed to enrich pending, so the next run retries it', () =>
    Effect.gen(function* () {
      // 1 of 6 cards is ~17%, over the 5% budget, so this tiny catalog also fails the run.
      const report = yield* Effect.flip(syncCatalog())
      expect(report._tag).toBe('SyncFailed')
      const db = yield* Db
      const pending = yield* db.query((d) => d.select({ id: cards.id }).from(cards).where(isNull(cards.rawData)))
      expect(pending).toEqual([{ id: 'base1-58' }])
    }).pipe(Effect.provide(layer({ failing: ['base1-58'] }))),
  )

  it.effect('fails loudly when too many sets fail instead of reporting success', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(syncCatalog())
      expect(error._tag).toBe('SyncFailed')
      expect(error.message).toMatch(/2\/3 sets failed/)
    }).pipe(Effect.provide(layer({ failing: ['base1', 'sv01'] }))),
  )
})
