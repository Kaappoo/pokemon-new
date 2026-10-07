import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, Share2 } from 'lucide-react'
import { CardGrid } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { EmptyState, Page, PageHeader } from '#/components/layout/page.tsx'
import { buttonVariants } from '#/components/ui/button.tsx'
import { formatCount } from '#/lib/format.ts'
import { requireAuth } from '#/lib/guards.ts'
import { collectionQuery } from '#/lib/queries.ts'
import { SITE_NAME } from '#/lib/seo.ts'

export const Route = createFileRoute('/collection')({
  beforeLoad: requireAuth,
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionQuery),
  head: () => ({ meta: [{ title: `Your binder · ${SITE_NAME}` }] }),
  component: CollectionPage,
})

function CollectionPage() {
  const { user } = Route.useRouteContext()
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
              <span className="font-semibold text-paper">{formatCount(copies)}</span> copies in total. Most recently
              changed first.
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
        <CardGrid
          cards={collection}
          renderTile={(card, index) => (
            <CardTile key={card.id} card={card} quantity={card.quantity} priority={index < 6} />
          )}
        />
      )}
    </Page>
  )
}
