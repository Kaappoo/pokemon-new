import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CardArt } from './card-art.tsx'

const meta = {
  title: 'Cards/CardArt',
  component: CardArt,
  args: { image: 'https://assets.tcgdex.net/en/base/base1/4', name: 'Charizard', localId: '4' },
  decorators: [(Story) => <div className="w-56">{Story()}</div>],
} satisfies Meta<typeof CardArt>
export default meta
type Story = StoryObj<typeof meta>

export const WithArt: Story = {}
export const HighQuality: Story = { args: { quality: 'high' } }
/** New sets are listed on TCGdex before every image is published. */
export const ArtComingSoon: Story = { args: { image: null, name: 'Forretress ex', localId: '002' } }
