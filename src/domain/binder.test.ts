import { describe, expect, it } from 'vitest'
import { summarizeBinder, type BinderEntry } from './binder.ts'

const entry = (overrides: Partial<BinderEntry>): BinderEntry => ({
  quantity: 1,
  category: 'Pokemon',
  types: ['Fire'],
  rarity: 'Rare',
  setId: 'base1',
  setName: 'Base Set',
  ...overrides,
})

describe('summarizeBinder', () => {
  it('counts distinct cards, copies and sets', () => {
    const summary = summarizeBinder([
      entry({ quantity: 3 }),
      entry({ quantity: 1, setId: 'sv1', setName: 'Scarlet & Violet' }),
    ])
    expect(summary).toMatchObject({ unique: 2, copies: 4, sets: 2 })
  })

  it('tallies Pokémon by type, counting dual types once per type and ignoring trainers', () => {
    const summary = summarizeBinder([
      entry({ quantity: 2, types: ['Water'] }),
      entry({ quantity: 1, types: ['Water', 'Psychic'] }),
      entry({ quantity: 5, category: 'Trainer', types: null }),
    ])
    expect(summary.byType).toEqual([
      { label: 'Water', count: 3 },
      { label: 'Psychic', count: 1 },
    ])
    expect(summary.byCategory).toEqual([
      { label: 'Trainer', count: 5 },
      { label: 'Pokemon', count: 3 },
    ])
  })

  it('handles an empty binder', () => {
    expect(summarizeBinder([])).toEqual({ unique: 0, copies: 0, sets: 0, byType: [], byCategory: [], topSets: [] })
  })
})
