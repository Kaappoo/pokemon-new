import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { CardGrid } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { EmptyState, Page, PageHeader } from '#/components/layout/page.tsx'
import { buttonVariants } from '#/components/ui/button.tsx'
import { pluralize } from '#/lib/format.ts'
import { requireAuth } from '#/lib/guards.ts'
import { wishlistQuery } from '#/lib/queries.ts'
import { SITE_NAME } from '#/lib/seo.ts'

export const Route = createFileRoute('/wishlist')({
  beforeLoad: requireAuth,
  loader: ({ context }) => context.queryClient.ensureQueryData(wishlistQuery),
  head: () => ({ meta: [{ title: `Wishlist · ${SITE_NAME}` }] }),
  component: WishlistPage,
})

function WishlistPage() {
  const { data: wishlist } = useSuspenseQuery(wishlistQuery)

  return (
    <Page>
      <PageHeader
        title="Wishlist"
        description={
          wishlist.length
            ? `${pluralize(wishlist.length, 'card')} you're hunting for. Add one to your binder and it drops off this list.`
            : undefined
        }
      />
      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Nothing on your wishlist"
          description="Open any card and tap “Add to wishlist” to keep track of what you're looking for."
          action={
            <Link to="/cards" className={buttonVariants()}>
              Find a card
            </Link>
          }
        />
      ) : (
        <CardGrid
          cards={wishlist}
          renderTile={(card, index) => <CardTile key={card.id} card={card} priority={index < 6} />}
        />
      )}
    </Page>
  )
}
