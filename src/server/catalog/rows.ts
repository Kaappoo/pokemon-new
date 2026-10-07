import { sql } from 'drizzle-orm'
import type { TcgdexCard } from '#/domain/tcgdex.ts'
import { cards } from '../db/schema.ts'

/** Columns written when a card is enriched with its full TCGdex payload. */
export const enrichedColumns = (card: TcgdexCard, raw: unknown, now: Date) => ({
  category: card.category,
  rarity: card.rarity ?? null,
  hp: card.hp ?? null,
  types: card.types ? [...card.types] : null,
  rawData: raw,
  detailsSyncedAt: now,
  updatedAt: now,
})

/**
 * Postgres ordering for printed card numbers, matching `compareLocalIds`:
 * plain numbers first in numeric order, then prefixed ones ("TG05"), then text.
 */
export const localIdOrder = [
  sql`(${cards.localId} ~ '^[0-9]+$') desc`,
  sql`nullif(regexp_replace(${cards.localId}, '[^0-9]', '', 'g'), '')::int asc nulls last`,
  sql`${cards.localId} asc`,
]

/** Escapes LIKE wildcards so a search for "100%" means the text, not a pattern. */
export const likeContains = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
