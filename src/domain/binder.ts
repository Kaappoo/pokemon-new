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
