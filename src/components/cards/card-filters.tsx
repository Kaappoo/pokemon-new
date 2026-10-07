import { useDebouncedCallback } from '@tanstack/react-pacer'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Select } from '#/components/ui/select.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { Tabs, TabsList, TabsTab } from '#/components/ui/tabs.tsx'
import { CARD_CATEGORIES, CATEGORY_LABELS, type CardCategory } from '#/domain/catalog.ts'
import type { SetSummary } from '#/server/catalog/service.ts'
import type { CardSearchParams } from '#/shared/schemas.ts'

const ALL = 'all'

export function CardFilters({
  search,
  onChange,
  sets,
  types,
}: {
  search: CardSearchParams
  onChange: (next: Partial<CardSearchParams>) => void
  sets: ReadonlyArray<SetSummary>
  types: ReadonlyArray<string>
}) {
  const [text, setText] = useState(search.q ?? '')
  // Only touch the URL (and the server) once typing pauses.
  const commitText = useDebouncedCallback((q: string) => onChange({ q: q.trim() || undefined }), { wait: 300 })
  const filtered = Boolean(search.q || search.set || search.type || search.category || search.pocket)

  return (
    <div className="mb-8 flex flex-col gap-5">
      <label className="relative">
        <span className="sr-only">Search cards by name</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-paper-dim" />
        <Input
          type="search"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            commitText(e.target.value)
          }}
          placeholder="Search by name: Charizard, Iono, Rare Candy…"
          className="h-14 pl-12 text-lg md:text-lg"
        />
      </label>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          value={search.category ?? ALL}
          onValueChange={(value) =>
            onChange({ category: value === ALL ? undefined : (value as CardCategory) })
          }
        >
          <TabsList>
            <TabsTab value={ALL}>All</TabsTab>
            {CARD_CATEGORIES.map((category) => (
              <TabsTab key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label="Set"
            className="w-56"
            value={search.set ?? ALL}
            onValueChange={(value) => onChange({ set: !value || value === ALL ? undefined : value })}
            options={[{ value: ALL, label: 'All sets' }, ...sets.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <Select
            aria-label="Pokémon type"
            className="w-40"
            value={search.type ?? ALL}
            onValueChange={(value) => onChange({ type: !value || value === ALL ? undefined : value })}
            options={[{ value: ALL, label: 'All types' }, ...types.map((t) => ({ value: t, label: t }))]}
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-paper-dim">
            <Switch
              checked={search.pocket ?? false}
              onCheckedChange={(checked) => onChange({ pocket: checked || undefined })}
            />
            TCG Pocket
          </label>
          {filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setText('')
                onChange({ q: undefined, set: undefined, type: undefined, category: undefined, pocket: undefined })
              }}
            >
              <X /> Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
