import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useRouteContext } from '@tanstack/react-router'
import { Heart, Minus, Plus } from 'lucide-react'
import { Button, buttonVariants } from '#/components/ui/button.tsx'
import { useBinderActions } from '#/hooks/use-binder-actions.ts'
import { cardStatusQuery } from '#/lib/queries.ts'
import { cn } from '#/lib/utils.ts'

/** Collection count and wishlist toggle for one card. Anonymous visitors get a way in instead. */
export function BinderActions({ cardId, cardName }: { cardId: string; cardName: string }) {
  const { user } = useRouteContext({ from: '__root__' })
  const location = useLocation()

  if (!user) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <p className="font-semibold">Keep track of {cardName}</p>
        <p className="text-sm text-paper-dim">Sign in to add it to your binder or wishlist.</p>
        <Link to="/sign-in" search={{ redirect: location.href }} className={buttonVariants({ size: 'lg' })}>
          Sign in
        </Link>
      </div>
    )
  }

  return <SignedInActions cardId={cardId} cardName={cardName} />
}

function SignedInActions({ cardId, cardName }: { cardId: string; cardName: string }) {
  const { data: status } = useQuery(cardStatusQuery(cardId))
  const actions = useBinderActions(cardId)
  const quantity = status?.quantity ?? 0
  const wanted = status?.wanted ?? false
  const busy = actions.setQuantity.isPending
  const copies = quantity === 1 ? '1 copy' : `${quantity} copies`

  const stepper = (size: 'icon' | 'icon-lg') => (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size={size}
        aria-label={`Remove a copy of ${cardName}`}
        disabled={quantity === 0 || busy}
        onClick={() => actions.setQuantity.mutate(quantity - 1)}
      >
        <Minus />
      </Button>
      <span aria-hidden className="w-10 text-center font-numerals text-4xl leading-none">
        {quantity}
      </span>
      <Button
        variant={quantity === 0 ? 'default' : 'secondary'}
        size={size}
        aria-label={`Add a copy of ${cardName}`}
        disabled={busy}
        onClick={() => actions.setQuantity.mutate(quantity + 1)}
      >
        <Plus />
      </Button>
    </div>
  )

  return (
    <>
      {/* One announcement for both layouts. */}
      <output aria-live="polite" className="sr-only">
        {quantity === 0 ? `${cardName} is not in your binder` : `${copies} of ${cardName} in your binder`}
      </output>

      {/* Wide screens: the panel beside the art. */}
      <div className="hidden flex-col gap-4 rounded-xl border border-line bg-surface p-5 lg:flex">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">In your binder</span>
            <span className="text-xs text-paper-dim">{quantity === 0 ? 'Not collected yet' : 'Copies you own'}</span>
          </div>
          {stepper('icon')}
        </div>
        <Button
          variant="outline"
          size="lg"
          aria-pressed={wanted}
          disabled={actions.setWanted.isPending}
          onClick={() => actions.setWanted.mutate(!wanted)}
          className={cn(wanted && 'border-orange text-orange')}
        >
          <Heart className={cn(wanted && 'fill-current')} />
          {wanted ? 'On your wishlist' : 'Add to wishlist'}
        </Button>
      </div>

      {/* Phones and tablets: pinned within thumb reach, above the bottom nav, while you scroll the details. */}
      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-30 border-t border-line bg-ink/95 backdrop-blur-md md:bottom-0 md:pb-[env(safe-area-inset-bottom)] lg:hidden">
        {/* The extra bottom padding on phones is where the bottom nav's raised Search button overlaps. */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-7 sm:px-6 md:pb-3">
          <Button
            variant="outline"
            size="icon-lg"
            aria-pressed={wanted}
            aria-label={wanted ? `Remove ${cardName} from your wishlist` : `Add ${cardName} to your wishlist`}
            disabled={actions.setWanted.isPending}
            onClick={() => actions.setWanted.mutate(!wanted)}
            className={cn(wanted && 'border-orange text-orange')}
          >
            <Heart className={cn(wanted && 'fill-current')} />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">In your binder</span>
            <span className="truncate text-xs text-paper-dim">{quantity === 0 ? 'Not collected yet' : copies}</span>
          </div>
          {stepper('icon-lg')}
        </div>
      </div>
    </>
  )
}
