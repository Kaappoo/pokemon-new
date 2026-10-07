import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Search } from 'lucide-react'
import { useMemo } from 'react'
import { CardGrid } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { Page } from '#/components/layout/page.tsx'
import { ReleaseDate } from '#/components/sets/release-date.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { buttonVariants } from '#/components/ui/button.tsx'
import { setAssetUrl } from '#/domain/catalog.ts'
import { formatCount } from '#/lib/format.ts'
import { collectionQuery, setQuery } from '#/lib/queries.ts'
import { seo, SITE_NAME } from '#/lib/seo.ts'

export const Route = createFileRoute('/sets/$setId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(setQuery(params.setId)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.set.name} · ${SITE_NAME}`,
          description: `All ${loaderData.cards.length} cards in ${loaderData.set.name} (${loaderData.set.serieName}).`,
        })
      : [],
  }),
  component: SetPage,
})

function SetPage() {
  const { setId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const { data } = useSuspenseQuery(setQuery(setId))
  const { data: collection } = useQuery({ ...collectionQuery, enabled: Boolean(user) })
  const { set, cards } = data
  const logo = setAssetUrl(set.logo)

  const owned = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of collection ?? []) if (item.setId === setId) map.set(item.id, item.quantity)
    return map
  }, [collection, setId])
  const completion = cards.length ? owned.size / cards.length : 0

  return (
    <Page>
      <Link
        to="/sets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-paper-dim transition-colors hover:text-paper"
      >
        <ChevronLeft className="size-4" /> All sets
      </Link>

      <header className="relative isolate mb-10 flex flex-col gap-6 overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-10">
        <div aria-hidden className="slab right-[-12%] hidden w-[22%] animate-slab sm:block" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:pr-[20%]">
          {logo ? <img src={logo} alt="" className="h-20 w-auto max-w-56 object-contain" /> : null}
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm text-paper-dim">{set.serieName}</p>
            <h1 className="font-display text-4xl sm:text-5xl">{set.name}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-paper-dim">
              <ReleaseDate date={set.releaseDate} />
              <span className="tabular">
                {formatCount(set.official)} numbered · {formatCount(cards.length)} total
              </span>
              {set.isPocket ? <Badge variant="live">TCG Pocket</Badge> : null}
            </p>
          </div>
        </div>
        {user ? (
          <div className="relative flex flex-col gap-2 border-t border-line pt-6 sm:mr-[20%]">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-semibold text-paper-dim">Your progress</span>
              <span className="font-numerals text-3xl leading-none">
                {owned.size}
                <span className="text-paper-dim">/{cards.length}</span>
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-raised"
              role="progressbar"
              aria-label="Cards collected from this set"
              aria-valuemin={0}
              aria-valuemax={cards.length}
              aria-valuenow={owned.size}
            >
              <div
                className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out-expo"
                style={{ width: `${Math.round(completion * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
      </header>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl">Cards</h2>
        <Link to="/cards" search={{ set: set.id }} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Search /> Filter this set
        </Link>
      </div>
      <CardGrid
        cards={cards}
        renderTile={(card, index) => (
          <CardTile key={card.id} card={card} quantity={owned.get(card.id)} priority={index < 6} showSet={false} />
        )}
      />
    </Page>
  )
}
