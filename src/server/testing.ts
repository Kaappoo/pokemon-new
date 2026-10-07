import { Effect, Layer } from 'effect'
import { newId } from '#/domain/ids.ts'
import type { TcgdexCard, TcgdexSet } from '#/domain/tcgdex.ts'
import { CurrentUser, type SessionUser } from './current-user.ts'
import { Db } from './db/client.ts'
import { cards, series, sets, user } from './db/schema.ts'
import { NotFound } from './errors.ts'
import { Tcgdex } from './tcgdex/client.ts'

/** Inserts a user row straight into the test database. */
export const insertUser = Effect.fn('testing.insertUser')(function* (name: string) {
  const db = yield* Db
  const handle = `${name.toLowerCase().replace(/\W/g, '')}_${newId().slice(0, 4)}`
  const row: SessionUser = { id: newId(), name, email: `${handle}@example.test`, username: handle, image: null }
  yield* db.query((d) => d.insert(user).values({ ...row, displayUsername: handle }))
  return row
})

/** Runs an effect as the given signed-in user. */
export const asUser =
  (who: SessionUser) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.provideService(effect, CurrentUser, who)

export const withDb = <ROut, E, RIn>(layer: Layer.Layer<ROut, E, RIn>) => layer.pipe(Layer.provideMerge(Db.layerTest))

/** A tiny fake of TCGdex: two physical sets and one Pocket set. */
export const fakeSets: Record<string, TcgdexSet> = {
  base1: {
    id: 'base1',
    name: 'Base Set',
    serie: { id: 'base', name: 'Base' },
    releaseDate: '1999-01-09',
    logo: 'https://assets.tcgdex.net/en/base/base1/logo',
    cardCount: { official: 102, total: 102 },
    cards: [
      { id: 'base1-4', localId: '4', name: 'Charizard', image: 'https://assets.tcgdex.net/en/base/base1/4' },
      { id: 'base1-58', localId: '58', name: 'Pikachu', image: 'https://assets.tcgdex.net/en/base/base1/58' },
      { id: 'base1-10', localId: '10', name: 'Mewtwo', image: 'https://assets.tcgdex.net/en/base/base1/10' },
    ],
  },
  sv01: {
    id: 'sv01',
    name: 'Scarlet & Violet',
    serie: { id: 'sv', name: 'Scarlet & Violet' },
    releaseDate: '2023-03-31',
    cardCount: { official: 198, total: 258 },
    cards: [
      { id: 'sv01-001', localId: '001', name: 'Pineco', image: 'https://assets.tcgdex.net/en/sv/sv01/001' },
      { id: 'sv01-002', localId: '002', name: 'Forretress ex', image: null },
    ],
  },
  A1: {
    id: 'A1',
    name: 'Genetic Apex',
    serie: { id: 'tcgp', name: 'Pokémon TCG Pocket' },
    releaseDate: '2024-10-30',
    cardCount: { official: 226, total: 286 },
    cards: [{ id: 'A1-001', localId: '001', name: 'Bulbasaur', image: 'https://assets.tcgdex.net/en/tcgp/A1/001' }],
  },
}

export const fakeCard = (id: string): TcgdexCard | undefined => {
  const set = Object.values(fakeSets).find((s) => s.cards.some((c) => c.id === id))
  const resume = set?.cards.find((c) => c.id === id)
  if (!set || !resume) return undefined
  return {
    ...resume,
    category: 'Pokemon',
    rarity: 'Rare',
    hp: 60,
    types: resume.name === 'Charizard' ? ['Fire'] : ['Psychic'],
    set: { id: set.id, name: set.name, cardCount: set.cardCount ?? null },
    attacks: [{ name: 'Tackle', damage: 10 }],
  }
}

/** In-memory Tcgdex. `failing` makes the named sets/cards error like a flaky upstream. */
export const tcgdexTest = (options: { failing?: ReadonlyArray<string> } = {}) =>
  Layer.succeed(
    Tcgdex,
    Tcgdex.of({
      listSets: () => Effect.succeed(Object.values(fakeSets).map(({ id, name }) => ({ id, name }))),
      getSet: (id) => {
        const set = fakeSets[id]
        if (options.failing?.includes(id)) return Effect.fail(new NotFound({ entity: 'Set', id }))
        return set ? Effect.succeed({ value: set, raw: set }) : Effect.fail(new NotFound({ entity: 'Set', id }))
      },
      getCard: (id) => {
        const card = fakeCard(id)
        if (options.failing?.includes(id)) return Effect.fail(new NotFound({ entity: 'Card', id }))
        return card ? Effect.succeed({ value: card, raw: card }) : Effect.fail(new NotFound({ entity: 'Card', id }))
      },
    }),
  )

/** Seeds the catalog directly (without the sync) for service tests. */
export const seedCatalog = Effect.fn('testing.seedCatalog')(function* () {
  const db = yield* Db
  for (const set of Object.values(fakeSets)) {
    const isPocket = set.serie.id === 'tcgp'
    yield* db.query((d) => d.insert(series).values(set.serie).onConflictDoNothing())
    yield* db.query((d) =>
      d.insert(sets).values({
        id: set.id,
        name: set.name,
        serieId: set.serie.id,
        releaseDate: set.releaseDate ?? '',
        logo: set.logo ?? '',
        cardCountOfficial: set.cardCount?.official ?? 0,
        cardCountTotal: set.cardCount?.total ?? 0,
        isPocket,
      }),
    )
    yield* db.query((d) =>
      d.insert(cards).values(
        set.cards.map((c) => ({
          id: c.id,
          localId: c.localId,
          name: c.name,
          image: c.image ?? '',
          setId: set.id,
          isPocket,
          category: 'Pokemon',
          types: c.name === 'Charizard' ? ['Fire'] : ['Psychic'],
        })),
      ),
    )
  }
})
