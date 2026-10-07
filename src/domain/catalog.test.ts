import { describe, expect, it } from 'vitest'
import { cardImageUrl, compareLocalIds, isPocketSerie, printedNumber, setAssetUrl } from './catalog.ts'

describe('catalog rules', () => {
  it('treats only the tcgp serie as Pokémon TCG Pocket', () => {
    expect(isPocketSerie('tcgp')).toBe(true)
    expect(isPocketSerie('sv')).toBe(false)
    expect(isPocketSerie('base')).toBe(false)
  })

  it('sorts card numbers the way they are printed', () => {
    const sorted = ['10', 'TG05', '2', 'SV001', '1', 'TG12', '102'].sort(compareLocalIds)
    expect(sorted).toEqual(['1', '2', '10', '102', 'SV001', 'TG05', 'TG12'])
  })

  it('builds image URLs only when TCGdex has published the art', () => {
    expect(cardImageUrl('https://assets.tcgdex.net/en/base/base1/4')).toBe(
      'https://assets.tcgdex.net/en/base/base1/4/low.webp',
    )
    expect(cardImageUrl('https://assets.tcgdex.net/en/base/base1/4', 'high')).toMatch(/\/high\.webp$/)
    expect(cardImageUrl('')).toBeNull()
    expect(cardImageUrl(null)).toBeNull()
    expect(setAssetUrl('https://assets.tcgdex.net/en/base/base1/logo')).toMatch(/logo\.webp$/)
  })

  it('prints collector numbers as "n/official" for numbered cards only', () => {
    expect(printedNumber('4', 102)).toBe('4/102')
    expect(printedNumber('TG05', 195)).toBe('TG05')
    expect(printedNumber('4', null)).toBe('4')
  })
})
