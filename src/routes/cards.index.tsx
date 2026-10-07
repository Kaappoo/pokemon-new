import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { CardFilters } from '#/components/cards/card-filters.tsx'
import { CardGrid } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { EmptyState, Page, PageHeader } from '#/components/layout/page.tsx'
import { PageSpinner } from '#/components/layout/page-spinner.tsx'
import { pluralize } from '#/lib/format.ts'
import { cardsQuery, setsQuery, typesQuery } from '#/lib/queries.ts'
import { seo, SITE_NAME } from '#/lib/seo.ts'
import { cardSearchParams, type CardSearchParams } from '#/shared/schemas.ts'

export const Route = createFileRoute('/cards/')({
  validateSearch: cardSearchParams,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(cardsQuery(deps)),
      context.queryClient.ensureQueryData(setsQuery(deps.pocket ?? false)),
      context.queryClient.ensureQueryData(typesQuery),
    ]),
  head: () => ({
    meta: seo({
      title: `Cards · ${SITE_NAME}`,
      description: 'Search every Pokémon TCG card by name, set, type and category.',
    }),
  }),
  component: CardsPage,
})

function CardsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: sets = [] } = useQuery(setsQuery(search.pocket ?? false))
  const { data: types = [] } = useQuery(typesQuery)
  const results = useInfiniteQuery({ ...cardsQuery(search), placeholderData: keepPreviousData })

  const cards = results.data?.pages.flatMap((page) => page.cards) ?? []
  const total = results.data?.pages[0]?.total ?? 0

  const update = (next: Partial<CardSearchParams>) =>
    navigate({ search: (current) => ({ ...current, ...next }), replace: true, resetScroll: false })

  return (
    <Page>
      <PageHeader
        title="Every card"
        description={
          search.pocket
            ? 'Physical Pokémon TCG cards, plus Pokémon TCG Pocket.'
            : 'The physical Pokémon TCG, from Base Set to the newest expansion.'
        }
      />
      <CardFilters search={search} onChange={update} sets={sets} types={types} />

      <div className="mb-4 flex items-center justify-between text-sm text-paper-dim">
        <span aria-live="polite">{results.isPlaceholderData ? 'Searching…' : pluralize(total, 'card')}</span>
      </div>

      {cards.length === 0 && !results.isFetching ? (
        <EmptyState
          icon={<SearchX />}
          title="No cards match"
          description="Try a shorter name, another set, or clear the filters."
        />
      ) : (
        <div className={results.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <CardGrid
            cards={cards}
            hasMore={results.hasNextPage}
            loadingMore={results.isFetchingNextPage}
            onLoadMore={() => void results.fetchNextPage()}
            renderTile={(card, index) => <CardTile key={card.id} card={card} priority={index < 6} />}
          />
          {results.isFetchingNextPage ? <PageSpinner /> : null}
        </div>
      )}
    </Page>
  )
}
