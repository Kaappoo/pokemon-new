import { describe, expect, it } from 'vitest'
import { fillBinder, summarizeBinder, type BinderEntry } from './binder.ts'

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

describe('fillBinder', () => {
  const card = (id: string) => ({ id })
  const base = { set: 'base1', cards: [card('base1-1'), card('base1-2'), card('base1-3')] }
  const jungle = { set: 'base2', cards: [card('base2-1'), card('base2-2')] }

  it('keeps every card of a set in order, leaving the ones you lack as empty pockets', () => {
    const [section] = fillBinder([base], new Map([['base1-3', 2]]))
    expect(section?.pockets.map((p) => [p.card.id, p.quantity])).toEqual([
      ['base1-1', 0],
      ['base1-2', 0],
      ['base1-3', 2],
    ])
    expect(section?.owned).toBe(1)
  })

  it('keeps the given set order and drops sets you own nothing from', () => {
    const sections = fillBinder(
      [jungle, base],
      new Map([
        ['base1-1', 1],
        ['base2-2', 1],
        ['base2-1', 4],
      ]),
    )
    expect(sections.map((s) => [s.set, s.owned])).toEqual([
      ['base2', 2],
      ['base1', 1],
    ])
    expect(fillBinder([base], new Map([['other-1', 1]]))).toEqual([])
  })
})
