import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import type { CardSummary } from '#/server/catalog/service.ts'
import { CardArt } from './card-art.tsx'

/** One card in a grid: art that lifts on hover, name and number underneath, and your copy count if you own it. */
export function CardTile({
  card,
  quantity,
  priority,
  showSet = true,
  style,
}: {
  card: CardSummary
  quantity?: number
  priority?: boolean
  showSet?: boolean
  style?: CSSProperties
}) {
  return (
    <Link
      to="/cards/$cardId"
      params={{ cardId: card.id }}
      className="group flex min-w-0 flex-col gap-2 rounded-lg"
      style={style}
    >
      <div className="relative transition-transform duration-300 ease-out-expo group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]">
        <CardArt image={card.image} name={card.name} localId={card.localId} priority={priority} />
        {quantity ? (
          <span className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-orange font-numerals text-lg text-on-orange shadow-[0_4px_10px_-4px_rgb(0_0_0/0.8)]">
            <span className="sr-only">You own </span>
            {quantity}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col px-0.5">
        <span className="truncate text-sm font-semibold">{card.name}</span>
        <span className="truncate text-xs text-paper-dim">
          <span className="tabular">#{card.localId}</span>
          {showSet ? <> · {card.setName}</> : null}
        </span>
      </div>
    </Link>
  )
}
