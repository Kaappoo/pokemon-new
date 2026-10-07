/**
 * Catalog rules: which sets belong to the physical TCG, how card numbers sort,
 * and how TCGdex image URLs are built. Pure, no IO.
 */

/** TCGdex files every Pokémon TCG Pocket (mobile game) set under this serie. */
export const POCKET_SERIE_ID = 'tcgp'

export const isPocketSerie = (serieId: string): boolean => serieId === POCKET_SERIE_ID

export const CARD_CATEGORIES = ['Pokemon', 'Trainer', 'Energy'] as const
export type CardCategory = (typeof CARD_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  Pokemon: 'Pokémon',
  Trainer: 'Trainer',
  Energy: 'Energy',
}

export type ImageQuality = 'low' | 'high'

/**
 * TCGdex stores image *base* URLs ("…/base/base1/4") and serves several sizes
 * and formats under them. Returns null when the card has no art yet (new sets
 * are often listed before every image is published).
 */
export const cardImageUrl = (base: string | null | undefined, quality: ImageQuality = 'low'): string | null =>
  base ? `${base}/${quality}.webp` : null

/** Same as cardImageUrl but PNG, which satori (Open Graph images) can decode. */
export const cardImagePng = (base: string | null | undefined): string | null => (base ? `${base}/high.png` : null)

/** Set logos and symbols are stored without an extension. */
export const setAssetUrl = (base: string | null | undefined): string | null => (base ? `${base}.webp` : null)

const leadingNumber = (localId: string): number | null => {
  const match = /\d+/.exec(localId)
  return match ? Number(match[0]) : null
}

/**
 * Orders card numbers the way they are printed: "2" before "10", plain
 * numbers before prefixed ones ("TG05", "SV001"), then alphabetically.
 */
export const compareLocalIds = (a: string, b: string): number => {
  const aPlain = /^\d+$/.test(a)
  const bPlain = /^\d+$/.test(b)
  if (aPlain !== bPlain) return aPlain ? -1 : 1
  const aNum = leadingNumber(a)
  const bNum = leadingNumber(b)
  if (aNum !== null && bNum !== null && aNum !== bNum) return aNum - bNum
  return a.localeCompare(b, 'en', { numeric: true })
}

/** "4/102" — the collector number as printed, when the set's official count is known. */
export const printedNumber = (localId: string, officialCount: number | null | undefined): string =>
  officialCount && /^\d+$/.test(localId) ? `${localId}/${officialCount}` : localId
