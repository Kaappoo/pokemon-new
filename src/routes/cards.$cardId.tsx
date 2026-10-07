import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { BinderActions } from '#/components/cards/binder-actions.tsx'
import { CardArt } from '#/components/cards/card-art.tsx'
import { Page } from '#/components/layout/page.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { CATEGORY_LABELS, printedNumber, setAssetUrl, type CardCategory } from '#/domain/catalog.ts'
import type { TcgdexCard } from '#/domain/tcgdex.ts'
import { cardQuery } from '#/lib/queries.ts'
import { absoluteUrl, seo, SITE_NAME } from '#/lib/seo.ts'

export const Route = createFileRoute('/cards/$cardId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(cardQuery(params.cardId)),
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.card.name} · ${loaderData.set.name} · ${SITE_NAME}`,
          description: `${loaderData.card.name} — #${printedNumber(loaderData.card.localId, loaderData.set.official)} from ${loaderData.set.name}${loaderData.card.rarity ? `, ${loaderData.card.rarity}` : ''}.`,
          image: absoluteUrl(`/api/og/card/${params.cardId}`),
        })
      : [],
  }),
  component: CardPage,
})

function CardPage() {
  const { cardId } = Route.useParams()
  const { data } = useSuspenseQuery(cardQuery(cardId))
  const { card, set, detail } = data
  const number = printedNumber(card.localId, set.official)
  const logo = setAssetUrl(set.logo)

  return (
    <Page>
      <Link
        to="/sets/$setId"
        params={{ setId: set.id }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-paper-dim transition-colors hover:text-paper"
      >
        <ChevronLeft className="size-4" /> {set.name}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CardArt
            image={card.image}
            name={card.name}
            localId={card.localId}
            quality="high"
            priority
            className="mx-auto w-full max-w-sm shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] lg:max-w-none"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex min-w-0 flex-col gap-3">
                <p className="flex flex-wrap items-center gap-2 text-sm text-paper-dim">
                  {logo ? <img src={logo} alt="" className="h-6 w-auto max-w-24 object-contain" /> : null}
                  <span>
                    {set.serieName} · {set.name}
                  </span>
                </p>
                <h1 className="font-display text-4xl break-words sm:text-6xl">{card.name}</h1>
              </div>
              <CollectorNumber number={number} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {card.category ? <Badge variant="outline">{categoryLabel(card.category)}</Badge> : null}
              {detail?.stage ? <Badge variant="outline">{detail.stage}</Badge> : null}
              {card.types.map((type) => (
                <Badge key={type} variant="outline">
                  {type}
                </Badge>
              ))}
              {card.rarity ? <Badge variant="muted">{card.rarity}</Badge> : null}
              {set.isPocket ? <Badge variant="live">TCG Pocket</Badge> : null}
            </div>
            {card.hp ? (
              <p className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-paper-dim">HP</span>
                <span className="font-numerals text-6xl leading-none">{card.hp}</span>
              </p>
            ) : null}
          </header>

          <BinderActions cardId={card.id} cardName={card.name} />

          {detail ? (
            <CardDetail detail={detail} />
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong p-5 text-sm text-paper-dim">
              Full details for this card aren&apos;t available right now. They&apos;ll appear after the next catalog
              sync.
            </p>
          )}
        </div>
      </div>
    </Page>
  )
}

/** The printed number on the signature slab, wiping in when the page opens. */
function CollectorNumber({ number }: { number: string }) {
  return (
    <div className="relative isolate shrink-0 overflow-hidden rounded-md px-4 py-2">
      <div aria-hidden className="slab inset-y-0 -inset-x-3 w-auto animate-slab" />
      <p className="relative flex flex-col items-end text-on-orange">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase">No.</span>
        <span className="font-numerals text-3xl leading-none sm:text-4xl">{number}</span>
      </p>
    </div>
  )
}

const categoryLabel = (category: string) => CATEGORY_LABELS[category as CardCategory] ?? category

function CardDetail({ detail }: { detail: TcgdexCard }) {
  const hasCombat = Boolean(detail.weaknesses?.length || detail.resistances?.length || detail.retreat != null)

  return (
    <div className="flex flex-col gap-8">
      {detail.abilities?.length || detail.attacks?.length ? (
        <Section title="Abilities & attacks">
          <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
            {detail.abilities?.map((ability) => (
              <div key={ability.name} className="flex flex-col gap-1.5 p-5">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold tracking-wide text-orange uppercase">{ability.type ?? 'Ability'}</span>
                  <span className="font-semibold">{ability.name}</span>
                </p>
                {ability.effect ? <p className="text-sm leading-relaxed text-paper-dim">{ability.effect}</p> : null}
              </div>
            ))}
            {detail.attacks?.map((attack) => (
              <div key={attack.name} className="flex flex-col gap-1.5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold">{attack.name}</span>
                    {attack.cost?.length ? (
                      <span className="flex flex-wrap gap-1">
                        {attack.cost.map((energy, i) => (
                          <Badge key={i} variant="muted">
                            {energy}
                          </Badge>
                        ))}
                      </span>
                    ) : null}
                  </div>
                  {attack.damage != null && attack.damage !== '' ? (
                    <span className="font-numerals text-4xl leading-none">{attack.damage}</span>
                  ) : null}
                </div>
                {attack.effect ? <p className="text-sm leading-relaxed text-paper-dim">{attack.effect}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {detail.effect ? (
        <Section title={detail.trainerType ? `${detail.trainerType} effect` : 'Effect'}>
          <p className="leading-relaxed text-paper-dim">{detail.effect}</p>
        </Section>
      ) : null}

      {hasCombat ? (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Weakness">{modifiers(detail.weaknesses)}</Stat>
          <Stat label="Resistance">{modifiers(detail.resistances)}</Stat>
          <Stat label="Retreat">
            {detail.retreat != null ? <span className="font-numerals text-3xl">{detail.retreat}</span> : '—'}
          </Stat>
        </div>
      ) : null}

      <Section title="Details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <Detail label="Rarity">{detail.rarity}</Detail>
          <Detail label="Illustrator">{detail.illustrator}</Detail>
          <Detail label="Regulation mark">{detail.regulationMark}</Detail>
          <Detail label="Evolves from">{detail.evolveFrom}</Detail>
          <Detail label="Variants">
            {detail.variants
              ? Object.entries(detail.variants)
                  .filter(([, has]) => has)
                  .map(([variant]) => variant.replace(/([A-Z])/g, ' $1').toLowerCase())
                  .join(', ')
              : null}
          </Detail>
          {detail.legal ? (
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-3">
              <dt className="text-xs font-semibold text-paper-dim">Legality</dt>
              <dd className="flex flex-wrap gap-2">
                <Badge variant={detail.legal.standard ? 'win' : 'loss'}>
                  Standard {detail.legal.standard ? 'legal' : 'not legal'}
                </Badge>
                <Badge variant={detail.legal.expanded ? 'win' : 'loss'}>
                  Expanded {detail.legal.expanded ? 'legal' : 'not legal'}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>
      </Section>

      {detail.description ? (
        <p className="border-l-2 border-orange pl-4 leading-relaxed text-paper-dim italic">{detail.description}</p>
      ) : null}
    </div>
  )
}

const modifiers = (list: TcgdexCard['weaknesses']) =>
  list?.length ? list.map((m) => `${m.type} ${m.value ?? ''}`.trim()).join(', ') : '—'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="text-xs font-semibold text-paper-dim">{label}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold text-paper-dim">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}
