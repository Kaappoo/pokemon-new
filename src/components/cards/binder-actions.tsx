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

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">In your binder</span>
          <span className="text-xs text-paper-dim">{quantity === 0 ? 'Not collected yet' : 'Copies you own'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={`Remove a copy of ${cardName}`}
            disabled={quantity === 0 || busy}
            onClick={() => actions.setQuantity.mutate(quantity - 1)}
          >
            <Minus />
          </Button>
          <output aria-live="polite" className="w-10 text-center font-numerals text-4xl leading-none">
            {quantity}
          </output>
          <Button
            variant={quantity === 0 ? 'default' : 'secondary'}
            size="icon-sm"
            aria-label={`Add a copy of ${cardName}`}
            disabled={busy}
            onClick={() => actions.setQuantity.mutate(quantity + 1)}
          >
            <Plus />
          </Button>
        </div>
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
  )
}
