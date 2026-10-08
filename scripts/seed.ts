import './env.ts'
import { Effect, Layer } from 'effect'
import type { TcgdexCard, TcgdexSet } from '../src/domain/tcgdex.ts'
import { NotFound } from '../src/server/errors.ts'
import { Tcgdex } from '../src/server/tcgdex/client.ts'

/**
 * Seeds a small demo catalog plus a demo account, for local development and
 * e2e tests when TCGdex isn't reachable. The catalog goes through the real
 * sync pipeline, fed by fixtures instead of the network.
 *
 *   pnpm db:migrate && pnpm db:seed      # then sign in as "ash" / "pallet-town-1"
 *
 * For a real catalog, run `pnpm sync` instead.
 */
if (process.env.DATABASE_URL && !process.argv.includes('--force')) {
  console.error('✗ DATABASE_URL is set. Seeding writes demo cards and a demo account; pass --force if you really mean it.')
  process.exit(1)
}

const img = (serie: string, set: string, n: string) => `https://assets.tcgdex.net/en/${serie}/${set}/${n}`

const fixtureSets: Array<TcgdexSet> = [
  {
    id: 'sv03.5',
    name: '151',
    serie: { id: 'sv', name: 'Scarlet & Violet' },
    releaseDate: '2023-09-22',
    logo: img('sv', 'sv03.5', 'logo'),
    tcgOnline: 'MEW',
    cardCount: { official: 165, total: 207 },
    cards: [
      ['001', 'Bulbasaur'],
      ['004', 'Charmander'],
      ['006', 'Charizard ex'],
      ['007', 'Squirtle'],
      ['025', 'Pikachu'],
      ['054', 'Psyduck'],
      ['094', 'Gengar'],
      ['133', 'Eevee'],
      ['143', 'Snorlax'],
      ['150', 'Mewtwo'],
      ['151', 'Mew ex'],
      ['198', 'Erika’s Invitation'],
    ].map(([n, name]) => ({ id: `sv03.5-${n}`, localId: n!, name: name!, image: img('sv', 'sv03.5', n!) })),
  },
  {
    id: 'base1',
    name: 'Base Set',
    serie: { id: 'base', name: 'Base' },
    releaseDate: '1999-01-09',
    logo: img('base', 'base1', 'logo'),
    cardCount: { official: 102, total: 102 },
    cards: [
      ['2', 'Blastoise'],
      ['4', 'Charizard'],
      ['10', 'Mewtwo'],
      ['15', 'Venusaur'],
      ['44', 'Bulbasaur'],
      ['46', 'Charmander'],
      ['58', 'Pikachu'],
      ['63', 'Squirtle'],
      ['91', 'Bill'],
      ['96', 'Double Colorless Energy'],
    ].map(([n, name]) => ({ id: `base1-${n}`, localId: n!, name: name!, image: img('base', 'base1', n!) })),
  },
  {
    id: 'A1',
    name: 'Genetic Apex',
    serie: { id: 'tcgp', name: 'Pokémon TCG Pocket' },
    releaseDate: '2024-10-30',
    logo: img('tcgp', 'A1', 'logo'),
    cardCount: { official: 226, total: 286 },
    cards: [
      ['001', 'Bulbasaur'],
      ['036', 'Charizard ex'],
      ['094', 'Pikachu'],
    ].map(([n, name]) => ({ id: `A1-${n}`, localId: n!, name: name!, image: img('tcgp', 'A1', n!) })),
  },
]

const TYPES: Record<string, string> = {
  Bulbasaur: 'Grass',
  Venusaur: 'Grass',
  Charmander: 'Fire',
  Charizard: 'Fire',
  'Charizard ex': 'Fire',
  Squirtle: 'Water',
  Blastoise: 'Water',
  Psyduck: 'Water',
  Pikachu: 'Lightning',
  Mewtwo: 'Psychic',
  'Mew ex': 'Psychic',
  Gengar: 'Darkness',
  Eevee: 'Colorless',
  Snorlax: 'Colorless',
}

const detailFor = (set: TcgdexSet, card: TcgdexSet['cards'][number]): TcgdexCard => {
  const type = TYPES[card.name]
  const base = { ...card, set: { id: set.id, name: set.name, cardCount: set.cardCount ?? null }, illustrator: 'Demo data' }
  if (!type) {
    const energy = card.name.includes('Energy')
    return {
      ...base,
      category: energy ? 'Energy' : 'Trainer',
      rarity: 'Uncommon',
      ...(energy
        ? { energyType: 'Special', effect: 'Provides 2 Colorless Energy.' }
        : { trainerType: 'Item', effect: 'Draw 2 cards.' }),
    }
  }
  const big = card.name.endsWith(' ex') || ['Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Gengar'].includes(card.name)
  return {
    ...base,
    category: 'Pokemon',
    rarity: big ? 'Rare Holo' : 'Common',
    hp: big ? 180 : 60,
    types: [type],
    stage: big ? 'Stage2' : 'Basic',
    attacks: big
      ? [{ name: 'Mega Blast', cost: [type, type, 'Colorless'], damage: 180, effect: 'Discard 2 Energy from this Pokémon.' }]
      : [{ name: 'Tackle', cost: ['Colorless'], damage: 20 }],
    weaknesses: [{ type: type === 'Fire' ? 'Water' : 'Fire', value: '×2' }],
    retreat: big ? 3 : 1,
    legal: { standard: set.id === 'sv03.5', expanded: set.id === 'sv03.5' },
    regulationMark: set.id === 'sv03.5' ? 'G' : null,
  }
}

const fixtureTcgdex = Layer.succeed(
  Tcgdex,
  Tcgdex.of({
    listSets: () => Effect.succeed(fixtureSets.map(({ id, name }) => ({ id, name }))),
    getSet: (id) => {
      const set = fixtureSets.find((s) => s.id === id)
      return set ? Effect.succeed({ value: set, raw: set }) : Effect.fail(new NotFound({ entity: 'Set', id }))
    },
    getCard: (id) => {
      const set = fixtureSets.find((s) => s.cards.some((c) => c.id === id))
      const card = set?.cards.find((c) => c.id === id)
      if (!set || !card) return Effect.fail(new NotFound({ entity: 'Card', id }))
      const detail = detailFor(set, card)
      return Effect.succeed({ value: detail, raw: detail })
    },
  }),
)

// Imported after env checks: these read DATABASE_URL / PGLITE_DIR at load time.
const { database } = await import('../src/server/db/index.ts')
const { Db } = await import('../src/server/db/client.ts')
const { syncCatalog } = await import('../src/server/catalog/sync.ts')
const { auth } = await import('../src/server/auth.ts')
const { collectionItems, user, wishlistItems } = await import('../src/server/db/schema.ts')
const { eq } = await import('drizzle-orm')

const report = await Effect.runPromise(
  syncCatalog().pipe(Effect.provide(Layer.mergeAll(Db.fromDatabase(database), fixtureTcgdex))),
)
console.log(`✓ demo catalog: ${report.sets} sets, ${report.cards} cards`)

const [existing] = await database.select({ id: user.id }).from(user).where(eq(user.username, 'ash'))
const ashId =
  existing?.id ??
  (
    await auth.api.signUpEmail({
      body: { name: 'Ash Ketchum', email: 'ash@pallet.town', password: 'pallet-town-1', username: 'ash' },
    })
  ).user.id

await database
  .insert(collectionItems)
  .values([
    { userId: ashId, cardId: 'sv03.5-025', quantity: 3 },
    { userId: ashId, cardId: 'sv03.5-006', quantity: 1 },
    { userId: ashId, cardId: 'sv03.5-001', quantity: 2 },
    { userId: ashId, cardId: 'base1-58', quantity: 1 },
  ])
  .onConflictDoNothing()
await database
  .insert(wishlistItems)
  .values([
    { userId: ashId, cardId: 'base1-4' },
    { userId: ashId, cardId: 'sv03.5-151' },
  ])
  .onConflictDoNothing()
console.log('✓ demo account: ash / pallet-town-1')
process.exit(0)
