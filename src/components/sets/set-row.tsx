import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { setAssetUrl } from '#/domain/catalog.ts'
import type { SetSummary } from '#/server/catalog/service.ts'
import { ReleaseDate } from './release-date.tsx'

/** One set in the list: logo, name, release date and card count on a single scannable line. */
export function SetRow({ set }: { set: SetSummary }) {
  const logo = setAssetUrl(set.logo)
  return (
    <Link
      to="/sets/$setId"
      params={{ setId: set.id }}
      className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-surface sm:gap-6 sm:px-4"
    >
      <div className="flex h-12 w-20 shrink-0 items-center justify-center sm:w-28">
        {logo ? (
          <img src={logo} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-display text-xs text-paper-dim">{set.id.toUpperCase()}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{set.name}</span>
        <ReleaseDate date={set.releaseDate} className="text-sm text-paper-dim" />
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-numerals text-2xl leading-none">{set.total || set.official}</span>
        <span className="text-xs text-paper-dim">cards</span>
      </div>
      <ChevronRight className="size-5 shrink-0 text-paper-dim transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
    </Link>
  )
}
