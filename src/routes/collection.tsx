import { useQueries, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, Share2 } from 'lucide-react'
import { useMemo } from 'react'
import { CardGrid, cardGridClass } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { EmptyPocket } from '#/components/cards/empty-pocket.tsx'
import { EmptyState, Page, PageHeader } from '#/components/layout/page.tsx'
import { PageSpinner } from '#/components/layout/page-spinner.tsx'
import { SetProgress } from '#/components/sets/set-progress.tsx'
import { buttonVariants } from '#/components/ui/button.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { fillBinder } from '#/domain/binder.ts'
import { formatCount } from '#/lib/format.ts'
import { requireAuth } from '#/lib/guards.ts'
import { collectionQuery, setQuery } from '#/lib/queries.ts'
import { SITE_NAME } from '#/lib/seo.ts'
import type { CardSummary } from '#/server/catalog/service.ts'
import { collectionSearchParams } from '#/shared/schemas.ts'

/** Sets in the order you last touched them: the collection comes most recently changed first. */
const setIdsOf = (collection: ReadonlyArray<CardSummary>) => [...new Set(collection.map((card) => card.setId))]

export const Route = createFileRoute('/collection')({
  validateSearch: collectionSearchParams,
  loaderDeps: ({ search }) => ({ missing: search.missing ?? false }),
  beforeLoad: requireAuth,
  loader: async ({ context, deps, cause }) => {
    const collection = await context.queryClient.ensureQueryData(collectionQuery)
    if (!deps.missing) return
    const sets = Promise.all(setIdsOf(collection).map((id) => context.queryClient.ensureQueryData(setQuery(id))))
    // Flipping the toggle keeps the page up; the binder pages show their own spinner while sets load.
    if (cause === 'stay') void sets.catch(() => undefined)
    else await sets
  },
  head: () => ({ meta: [{ title: `Your binder · ${SITE_NAME}` }] }),
  component: CollectionPage,
})

function CollectionPage() {
  const { user } = Route.useRouteContext()
  const { missing = false } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: collection } = useSuspenseQuery(collectionQuery)
  const copies = collection.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Page>
      <PageHeader
        title="Your binder"
        description={
          collection.length ? (
            <>
              <span className="font-semibold text-paper">{formatCount(collection.length)}</span> different cards,{' '}
              <span className="font-semibold text-paper">{formatCount(copies)}</span> copies in total.
            </>
          ) : undefined
        }
        actions={
          user.username && collection.length ? (
            <Link
              to="/u/$username"
              params={{ username: user.username }}
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <Share2 /> Public profile
            </Link>
          ) : null
        }
      />
      {collection.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Your binder is empty"
          description="Open a card and use the + button to add the copies you own. Sets show how close you are to completing them."
          action={
            <Link to="/sets" className={buttonVariants()}>
              Start with a set
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-paper-dim">
              {missing ? 'Set by set, in printed order.' : 'Most recently changed first.'}
            </p>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-paper-dim">
              <Switch
                checked={missing}
                onCheckedChange={(checked) =>
                  navigate({
                    search: { missing: checked || undefined },
                    replace: true,
                    resetScroll: false,
                    viewTransition: false,
                  })
                }
              />
              Show missing cards
            </label>
          </div>
          {missing ? (
            <BinderPages collection={collection} />
          ) : (
            <CardGrid
              cards={collection}
              renderTile={(card, index) => (
                <CardTile key={card.id} card={card} quantity={card.quantity} priority={index < 6} />
              )}
            />
          )}
        </>
      )}
    </Page>
  )
}

/** The binder as binder pages: every card of each set you've started, gaps left as empty pockets. */
function BinderPages({ collection }: { collection: ReadonlyArray<CardSummary & { quantity: number }> }) {
  const setIds = useMemo(() => setIdsOf(collection), [collection])
  const owned = useMemo(() => new Map(collection.map((card) => [card.id, card.quantity])), [collection])
  const sets = useQueries({
    queries: setIds.map((id) => setQuery(id)),
    combine: (results) => ({
      data: results.flatMap((result) => (result.data ? [result.data] : [])),
      pending: results.some((result) => result.isPending),
    }),
  })
  const sections = useMemo(() => fillBinder(sets.data, owned), [sets.data, owned])

  return (
    <div className="flex flex-col gap-14">
      {sections.map(({ set, pockets, owned: count }) => (
        <section key={set.id} aria-labelledby={`binder-${set.id}`} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm text-paper-dim">{set.serieName}</p>
              <h2 id={`binder-${set.id}`} className="font-display text-2xl sm:text-3xl">
                <Link to="/sets/$setId" params={{ setId: set.id }} className="transition-colors hover:text-orange">
                  {set.name}
                </Link>
              </h2>
            </div>
            <SetProgress
              owned={count}
              total={pockets.length}
              label="Collected"
              ariaLabel={`Cards collected from ${set.name}`}
              className="w-full sm:w-72"
            />
          </div>
          <div className={cardGridClass}>
            {pockets.map(({ card, quantity }) =>
              quantity > 0 ? (
                <CardTile key={card.id} card={card} quantity={quantity} showSet={false} />
              ) : (
                <EmptyPocket key={card.id} card={card} />
              ),
            )}
          </div>
        </section>
      ))}
      {sets.pending ? <PageSpinner /> : null}
    </div>
  )
}
