import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Layers } from 'lucide-react'
import { CardArt } from '#/components/cards/card-art.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { ReleaseDate } from '#/components/sets/release-date.tsx'
import { buttonVariants } from '#/components/ui/button.tsx'
import { formatCount } from '#/lib/format.ts'
import { homeQuery } from '#/lib/queries.ts'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
})

const FAN = ['-rotate-[8deg] translate-y-4', 'z-10 -mx-8 sm:-mx-14', 'rotate-[8deg] translate-y-4']

function Home() {
  const { user } = Route.useRouteContext()
  const { data } = useSuspenseQuery(homeQuery)
  const { stats, latest, latestCards } = data
  const fan = latestCards.slice(0, 3)
  const grid = fan.length === 3 ? latestCards.slice(3, 15) : latestCards.slice(0, 12)

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="slab right-[-14%] hidden opacity-90 lg:block" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-24">
          <div className="flex flex-col gap-8">
            <h1 className="font-display text-[clamp(3rem,9vw,6rem)] leading-[0.88]">
              Every card.
              <br />
              <span className="text-orange">One binder.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-paper-dim">
              Every physical Pokémon TCG card, from Base Set to this month&apos;s release, with no Pocket cards mixed
              in. Look anything up in a second, track the copies you own and keep a wishlist for your next trip to
              the shop.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/cards" className={buttonVariants({ size: 'xl' })}>
                Browse every card
                <ArrowRight />
              </Link>
              <Link to={user ? '/collection' : '/sets'} className={buttonVariants({ size: 'xl', variant: 'outline' })}>
                <Layers />
                {user ? 'Open your binder' : 'See the sets'}
              </Link>
            </div>
            <dl className="flex gap-10 border-t border-line pt-6">
              <div>
                <dt className="text-sm font-semibold text-paper-dim">Cards</dt>
                <dd className="font-numerals text-5xl leading-none sm:text-6xl">{formatCount(stats.cards)}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-paper-dim">Sets</dt>
                <dd className="font-numerals text-5xl leading-none sm:text-6xl">{formatCount(stats.sets)}</dd>
              </div>
            </dl>
          </div>

          {fan.length === 3 ? (
            <div className="relative flex justify-center lg:justify-end lg:pr-10" aria-label={`Cards from ${latest?.name}`}>
              {fan.map((card, i) => (
                <Link
                  key={card.id}
                  to="/cards/$cardId"
                  params={{ cardId: card.id }}
                  className={cn(
                    'w-28 shrink-0 transition-transform duration-500 ease-out-expo hover:-translate-y-3 min-[400px]:w-32 sm:w-48',
                    FAN[i],
                  )}
                >
                  <CardArt
                    image={card.image}
                    name={card.name}
                    localId={card.localId}
                    quality="high"
                    priority
                    className="shadow-[0_24px_48px_-20px_rgb(0_0_0/0.95)]"
                  />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
        {[
          [
            'Look it up',
            'Search by name, set, type or category. Cards from Pokémon TCG Pocket stay out of the way unless you ask for them.',
          ],
          ['Collect', 'Count the copies you own and watch each set fill up, card by card, until it is complete.'],
          ['Want', 'Keep a wishlist of what you are hunting. Cards drop off it the moment you add them to your binder.'],
        ].map(([title, copy]) => (
          <div key={title} className="flex flex-col gap-3 border-t-2 border-orange pt-5">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="leading-relaxed text-paper-dim">{copy}</p>
          </div>
        ))}
      </section>

      {latest && grid.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-3xl">Newest set: {latest.name}</h2>
              <ReleaseDate date={latest.releaseDate} className="text-sm text-paper-dim" />
            </div>
            <Link to="/sets/$setId" params={{ setId: latest.id }} className={buttonVariants({ variant: 'link' })}>
              All {formatCount(latest.total || latest.official)} cards <ArrowRight />
            </Link>
          </div>
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
            {grid.map((card, index) => (
              <CardTile key={card.id} card={card} showSet={false} style={{ ['--i' as string]: index }} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
