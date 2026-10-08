import { z } from 'zod'
import { CARD_CATEGORIES } from '#/domain/catalog.ts'

/**
 * Zod schemas for everything a user types or puts in a URL. They validate
 * forms and search params on the client, and the same objects validate
 * server-function input, so both sides agree. TCGdex payloads use Effect
 * Schema instead (see src/domain/tcgdex.ts).
 */

export const CARDS_PER_PAGE = 48

/** /cards search params — also the input of the card search server function. */
export const cardSearchParams = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  set: z.string().trim().max(40).optional().catch(undefined),
  type: z.string().trim().max(20).optional().catch(undefined),
  category: z.enum(CARD_CATEGORIES).optional().catch(undefined),
  pocket: z.boolean().optional().catch(undefined),
})
export type CardSearchParams = z.infer<typeof cardSearchParams>

export const cardSearchInput = z.object({
  q: z.string().trim().max(80).optional(),
  set: z.string().trim().max(40).optional(),
  type: z.string().trim().max(20).optional(),
  category: z.enum(CARD_CATEGORIES).optional(),
  includePocket: z.boolean().default(false),
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(96).default(CARDS_PER_PAGE),
})
export type CardSearchInput = z.infer<typeof cardSearchInput>

export const setsInput = z.object({ includePocket: z.boolean().default(false) })
export const setIdInput = z.object({ setId: z.string().trim().min(1).max(40) })
export const cardIdInput = z.object({ cardId: z.string().trim().min(1).max(60) })

export const wishlistInput = z.object({
  cardId: z.string().trim().min(1).max(60),
  wanted: z.boolean(),
})

export const quantityInput = z.object({
  cardId: z.string().trim().min(1).max(60),
  /** 0 removes the card from the collection. */
  quantity: z.number().int().min(0).max(999),
})

export const usernameInput = z.object({ username: z.string().trim().min(1).max(40) })

export const profileInput = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(60),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(24)
    .regex(/^[a-z0-9_.]+$/i, 'Letters, numbers, dots and underscores only'),
  bio: z.string().trim().max(240).optional(),
  favoriteCard: z.string().trim().max(80).optional(),
  image: z.url('Use a full https:// image link').nullable().optional().or(z.literal('')),
})
export type ProfileInput = z.infer<typeof profileInput>

/**
 * POST /api/cards/lookup — Pokémon TCG Live deck-list references ("TWM 130")
 * to resolve. Used by tcgRank to show card art for its deck lists.
 */
export const liveCardLookupInput = z.object({
  cards: z
    .array(z.object({ setCode: z.string().trim().min(1).max(12), number: z.string().trim().min(1).max(12) }))
    .max(120),
})
export type LiveCardLookupInput = z.infer<typeof liveCardLookupInput>
