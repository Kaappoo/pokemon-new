import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Badge, LiveDot } from './badge.tsx'

const meta = { title: 'UI/Badge', component: Badge } satisfies Meta<typeof Badge>
export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="live">
        <LiveDot /> New set
      </Badge>
      <Badge variant="outline">Rare Holo</Badge>
      <Badge>×3 in your binder</Badge>
      <Badge variant="win">Standard legal</Badge>
      <Badge variant="loss">Not legal</Badge>
      <Badge variant="muted">Art coming soon</Badge>
    </div>
  ),
}
