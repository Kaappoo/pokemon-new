/**
 * Collection maths for the binder: totals and breakdowns shown on profiles.
 * Pure, no IO.
 */

export interface BinderEntry {
  readonly quantity: number
  readonly category: string | null
  readonly types: ReadonlyArray<string> | null
  readonly rarity: string | null
  readonly setId: string
  readonly setName: string
}

export interface Tally {
  readonly label: string
  readonly count: number
}

export interface BinderSummary {
  /** Distinct cards owned. */
  readonly unique: number
  /** Copies owned, counting duplicates. */
  readonly copies: number
  readonly sets: number
  /** Pokémon cards by energy type; dual-type cards count once per type. */
  readonly byType: ReadonlyArray<Tally>
  readonly byCategory: ReadonlyArray<Tally>
  readonly topSets: ReadonlyArray<Tally>
}

const tallyDesc = (counts: Map<string, number>, limit = Infinity): Array<Tally> =>
  [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)

const bump = (map: Map<string, number>, key: string, by: number) => map.set(key, (map.get(key) ?? 0) + by)

export const summarizeBinder = (entries: ReadonlyArray<BinderEntry>): BinderSummary => {
  const byType = new Map<string, number>()
  const byCategory = new Map<string, number>()
  const bySet = new Map<string, number>()
  let copies = 0

  for (const entry of entries) {
    copies += entry.quantity
    bump(byCategory, entry.category ?? 'Unknown', entry.quantity)
    bump(bySet, entry.setName, entry.quantity)
    if (entry.category === 'Pokemon') for (const type of entry.types ?? []) bump(byType, type, entry.quantity)
  }

  return {
    unique: entries.length,
    copies,
    sets: new Set(entries.map((e) => e.setId)).size,
    byType: tallyDesc(byType),
    byCategory: tallyDesc(byCategory),
    topSets: tallyDesc(bySet, 5),
  }
}

/** One pocket of a binder page: a card of the set and how many copies you own (0 = an empty pocket). */
export interface Pocket<C> {
  readonly card: C
  readonly quantity: number
}

export interface BinderSection<S, C> {
  readonly set: S
  /** Every card of the set in the order it was given (printed-number order), owned or not. */
  readonly pockets: ReadonlyArray<Pocket<C>>
  /** Distinct cards of this set you own. */
  readonly owned: number
}

/**
 * Lays out the binder as real binder pages: for each set you've started, every
 * card in printed order, with the ones you don't own left as empty pockets.
 * Sets keep the order they're given; sets you own nothing from are dropped.
 */
export const fillBinder = <S, C extends { readonly id: string }>(
  sets: ReadonlyArray<{ readonly set: S; readonly cards: ReadonlyArray<C> }>,
  owned: ReadonlyMap<string, number>,
): Array<BinderSection<S, C>> =>
  sets
    .map(({ set, cards }) => {
      const pockets = cards.map((card) => ({ card, quantity: owned.get(card.id) ?? 0 }))
      return { set, pockets, owned: pockets.filter((p) => p.quantity > 0).length }
    })
    .filter((section) => section.owned > 0)
