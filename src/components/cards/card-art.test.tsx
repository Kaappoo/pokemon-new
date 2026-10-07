import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardArt } from './card-art.tsx'

const base = 'https://assets.tcgdex.net/en/base/base1/4'

describe('CardArt', () => {
  it('shows the TCGdex art at the requested quality', () => {
    render(<CardArt image={base} name="Charizard" localId="4" quality="high" />)
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveAttribute('src', `${base}/high.webp`)
  })

  it('shows a placeholder when the set has no art yet', () => {
    render(<CardArt image={null} name="Forretress ex" localId="002" />)
    const placeholder = screen.getByRole('img', { name: 'Forretress ex' })
    expect(placeholder.tagName).toBe('DIV')
    expect(placeholder).toHaveTextContent('Art coming soon')
  })

  it('falls back to the placeholder when the image fails to load', () => {
    render(<CardArt image={base} name="Charizard" localId="4" />)
    fireEvent.error(screen.getByRole('img', { name: 'Charizard' }))
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveTextContent('Image unavailable')
  })
})
