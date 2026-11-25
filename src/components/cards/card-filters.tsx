import { useDebouncedCallback } from '@tanstack/react-pacer'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '#/components/ui/dialog.tsx'
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
  /** Filters that live behind the phone "Filters" button. */
  const refined = [search.set, search.type, search.pocket].filter(Boolean).length
  const setName = sets.find((s) => s.id === search.set)?.name ?? search.set

  const clearAll = () => {
    setText('')
    onChange({ q: undefined, set: undefined, type: undefined, category: undefined, pocket: undefined })
  }

  const setSelect = (className: string) => (
    <Select
      aria-label="Set"
      className={className}
      value={search.set ?? ALL}
      onValueChange={(value) => onChange({ set: !value || value === ALL ? undefined : value })}
      options={[{ value: ALL, label: 'All sets' }, ...sets.map((s) => ({ value: s.id, label: s.name }))]}
    />
  )
  const typeSelect = (className: string) => (
    <Select
      aria-label="Pokémon type"
      className={className}
      value={search.type ?? ALL}
      onValueChange={(value) => onChange({ type: !value || value === ALL ? undefined : value })}
      options={[{ value: ALL, label: 'All types' }, ...types.map((t) => ({ value: t, label: t }))]}
    />
  )
  const pocketSwitch = (
    <Switch
      checked={search.pocket ?? false}
      onCheckedChange={(checked) => onChange({ pocket: checked || undefined })}
    />
  )

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
          onValueChange={(value) => onChange({ category: value === ALL ? undefined : (value as CardCategory) })}
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

        {/* Wide screens: every filter in one row. */}
        <div className="hidden flex-wrap items-center gap-3 lg:flex">
          {setSelect('w-56')}
          {typeSelect('w-40')}
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-paper-dim">
            {pocketSwitch}
            TCG Pocket
          </label>
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X /> Clear
            </Button>
          ) : null}
        </div>

        {/* Phones and tablets: one button, with what's active as removable chips, so results start sooner. */}
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <SlidersHorizontal />
                  Filters
                  {refined ? <span className="font-numerals text-base leading-none text-orange">{refined}</span> : null}
                </Button>
              }
            />
            <DialogContent sheet title="Filters">
              <div className="flex flex-col gap-5">
                {setSelect('w-full')}
                {typeSelect('w-full')}
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Include TCG Pocket</span>
                    <span className="text-xs leading-relaxed text-paper-dim">
                      Cards from the Pokémon TCG Pocket mobile game. They aren&apos;t physical cards, so they&apos;re
                      hidden unless you ask.
                    </span>
                  </span>
                  {pocketSwitch}
                </label>
                <div className="flex gap-3 pt-1">
                  {filtered ? (
                    <Button variant="ghost" size="lg" className="flex-1" onClick={clearAll}>
                      Clear all
                    </Button>
                  ) : null}
                  <DialogClose render={<Button size="lg" className="flex-1" />}>Show cards</DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {search.set ? <Chip label={setName ?? ''} onRemove={() => onChange({ set: undefined })} /> : null}
          {search.type ? <Chip label={search.type} onRemove={() => onChange({ type: undefined })} /> : null}
          {search.pocket ? <Chip label="TCG Pocket" onRemove={() => onChange({ pocket: undefined })} /> : null}
        </div>
      </div>
    </div>
  )
}

/** An active filter you can drop with one tap. */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface-raised pr-2 pl-3 text-sm font-semibold transition-colors hover:border-orange hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
    >
      {label}
      <X className="size-3.5" />
    </button>
  )
}
