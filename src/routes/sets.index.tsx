import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Page, PageHeader } from '#/components/layout/page.tsx'
import { SetRow } from '#/components/sets/set-row.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { pluralize } from '#/lib/format.ts'
import { setsQuery } from '#/lib/queries.ts'
import { seo, SITE_NAME } from '#/lib/seo.ts'
import type { SetSummary } from '#/server/catalog/service.ts'

const search = z.object({ pocket: z.boolean().optional().catch(undefined) })

export const Route = createFileRoute('/sets/')({
  validateSearch: search,
  loaderDeps: ({ search }) => ({ pocket: search.pocket ?? false }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(setsQuery(deps.pocket)),
  head: () => ({
    meta: seo({
      title: `Sets · ${SITE_NAME}`,
      description: 'Every Pokémon TCG expansion, from Base Set to the newest release.',
    }),
  }),
  component: SetsPage,
})

/** Groups sets by series, keeping the newest series first (sets arrive newest first). */
const bySeries = (sets: ReadonlyArray<SetSummary>) => {
  const groups = new Map<string, { name: string; sets: Array<SetSummary> }>()
  for (const set of sets) {
    const group = groups.get(set.serieId) ?? { name: set.serieName, sets: [] }
    group.sets.push(set)
    groups.set(set.serieId, group)
  }
  return [...groups.entries()]
}

function SetsPage() {
  const { pocket = false } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: sets } = useSuspenseQuery(setsQuery(pocket))

  return (
    <Page>
      <PageHeader
        title="Sets"
        description={`${pluralize(sets.length, 'expansion')}, newest first.`}
        actions={
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-paper-dim">
            <Switch
              checked={pocket}
              onCheckedChange={(checked) => navigate({ search: { pocket: checked || undefined }, replace: true })}
            />
            Include TCG Pocket
          </label>
        }
      />
      <div className="flex flex-col gap-12">
        {bySeries(sets).map(([serieId, group]) => (
          <section key={serieId} aria-labelledby={`serie-${serieId}`}>
            <h2
              id={`serie-${serieId}`}
              className="mb-2 flex items-baseline justify-between gap-4 border-b border-line pb-3 font-display text-2xl"
            >
              {group.name}
              <span className="font-sans text-sm font-semibold text-paper-dim">{pluralize(group.sets.length, 'set')}</span>
            </h2>
            <div className="-mx-3 flex flex-col sm:-mx-4">
              {group.sets.map((set) => (
                <SetRow key={set.id} set={set} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  )
}
