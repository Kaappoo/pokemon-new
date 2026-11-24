import { Link } from '@tanstack/react-router'
import type { CardSummary } from '#/server/catalog/service.ts'

/**
 * A card you don't own yet, shown as an empty binder pocket: the printed
 * number where the card would sit, the name underneath. Links to the card so
 * you can log it the moment you pull it.
 */
export function EmptyPocket({ card }: { card: CardSummary }) {
  return (
    <Link
      to="/cards/$cardId"
      params={{ cardId: card.id }}
      className="group flex min-w-0 flex-col gap-2 rounded-lg"
      aria-label={`${card.name}, #${card.localId}, not in your binder`}
    >
      <div className="card-frame flex items-center justify-center border-dashed border-line-strong bg-transparent transition-colors duration-200 group-hover:border-paper-dim group-hover:bg-surface">
        <span
          aria-hidden
          className="font-numerals text-4xl text-paper-dim/50 transition-colors group-hover:text-paper-dim"
        >
          {card.localId}
        </span>
      </div>
      <div aria-hidden className="flex min-w-0 flex-col px-0.5">
        <span className="truncate text-sm font-semibold text-paper-dim">{card.name}</span>
        <span className="truncate text-xs text-paper-dim">
          <span className="tabular">#{card.localId}</span>
        </span>
      </div>
    </Link>
  )
}
