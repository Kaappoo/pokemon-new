import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { TcgdexCard, TcgdexSet } from './tcgdex.ts'

describe('TCGdex payloads', () => {
  it('decodes a Pokémon card and ignores fields we do not model', () => {
    const card = Schema.decodeUnknownSync(TcgdexCard)({
      id: 'base1-4',
      localId: '4',
      name: 'Charizard',
      image: 'https://assets.tcgdex.net/en/base/base1/4',
      category: 'Pokemon',
      rarity: 'Rare',
      hp: 120,
      types: ['Fire'],
      attacks: [{ cost: ['Fire', 'Fire', 'Fire', 'Fire'], name: 'Fire Spin', damage: 100 }],
      weaknesses: [{ type: 'Water', value: '×2' }],
      set: { id: 'base1', name: 'Base Set', cardCount: { official: 102, total: 102 } },
      legal: { standard: false, expanded: false },
      pricing: { cardmarket: { avg: 250 } },
    })
    expect(card).toMatchObject({ name: 'Charizard', hp: 120, attacks: [{ damage: 100 }] })
    expect('pricing' in card).toBe(false)
  })

  it('accepts null where TCGdex has no data yet', () => {
    const set = Schema.decodeUnknownSync(TcgdexSet)({
      id: 'me03',
      name: 'Perfect Order',
      logo: null,
      serie: { id: 'me', name: 'Mega Evolution' },
      releaseDate: null,
      cardCount: { official: 88, total: 124 },
      cards: [{ id: 'me03-001', localId: '001', name: 'Bulbasaur', image: null }],
    })
    expect(set.cards[0]?.image).toBeNull()
  })
})
