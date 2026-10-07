import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, PencilLine, Share2 } from 'lucide-react'
import { CardGrid } from '#/components/cards/card-grid.tsx'
import { CardTile } from '#/components/cards/card-tile.tsx'
import { EmptyState, Page } from '#/components/layout/page.tsx'
import { TypeChart } from '#/components/profile/type-chart.tsx'
import { Avatar } from '#/components/ui/avatar.tsx'
import { Button, buttonVariants } from '#/components/ui/button.tsx'
import { LocalTime } from '#/components/ui/local-time.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { Tabs, TabsList, TabsPanel, TabsTab } from '#/components/ui/tabs.tsx'
import { toast } from '#/components/ui/toast.tsx'
import { CATEGORY_LABELS, type CardCategory } from '#/domain/catalog.ts'
import { formatCount, pluralize } from '#/lib/format.ts'
import { profileCollectionQuery, profileQuery } from '#/lib/queries.ts'
import { absoluteUrl, seo, SITE_NAME } from '#/lib/seo.ts'

export const Route = createFileRoute('/u/$username')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(profileQuery(params.username)),
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.user.name} (@${loaderData.user.username}) · ${SITE_NAME}`,
          description: `${pluralize(loaderData.summary.unique, 'card')} from ${pluralize(loaderData.summary.sets, 'set')} in ${loaderData.user.name}'s binder.`,
          image: absoluteUrl(`/api/og/collector/${params.username}`),
        })
      : [],
  }),
  component: ProfilePage,
})

function ProfilePage() {
  const { username } = Route.useParams()
  const { user: viewer } = Route.useRouteContext()
  const { data: profile } = useSuspenseQuery(profileQuery(username))
  const { data: binder } = useQuery(profileCollectionQuery(username))
  const { user, summary } = profile
  const isMe = viewer?.id === user.id

  const share = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: `${user.name}'s binder`, url }).catch(() => {})
    else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    }
  }

  return (
    <Page>
      <header className="relative isolate mb-10 flex flex-col gap-8 overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-10">
        <div aria-hidden className="slab right-[-10%] hidden w-[20%] animate-slab sm:block" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:pr-[18%]">
          <Avatar name={user.name} src={user.image} size="xl" className="ring-4 ring-ink" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-display text-4xl sm:text-5xl">{user.name}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-paper-dim">
              <span>@{user.username}</span>
              <span>
                Collecting since <LocalTime value={user.joinedAt} options={{ month: 'long', year: 'numeric' }} />
              </span>
            </p>
            {user.bio ? <p className="max-w-xl text-paper-dim">{user.bio}</p> : null}
            {user.favoriteCard ? (
              <p className="text-sm text-paper-dim">
                Favourite card: <span className="font-semibold text-paper">{user.favoriteCard}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="relative flex flex-col gap-6 border-t border-line pt-6 sm:mr-[18%] sm:flex-row sm:items-end sm:justify-between">
          <dl className="flex gap-8 sm:gap-12">
            <Stat label="Different cards" value={summary.unique} />
            <Stat label="Copies" value={summary.copies} />
            <Stat label="Sets" value={summary.sets} />
          </dl>
          <div className="flex gap-2">
            {isMe ? (
              <Link to="/settings" className={buttonVariants({ variant: 'outline' })}>
                <PencilLine /> Edit
              </Link>
            ) : null}
            <Button variant="secondary" onClick={() => void share()}>
              <Share2 /> Share
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="binder">
        <TabsList>
          <TabsTab value="binder">Binder</TabsTab>
          <TabsTab value="stats">Stats</TabsTab>
        </TabsList>
        <TabsPanel value="binder">
          {!binder ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-[63/88]" />
              ))}
            </div>
          ) : binder.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={isMe ? 'Your binder is empty' : 'Nothing in this binder yet'}
              description={
                isMe
                  ? 'Open any card and tap + to add the copies you own.'
                  : `${user.name} hasn't added any cards yet.`
              }
            />
          ) : (
            <CardGrid
              cards={binder}
              renderTile={(card) => <CardTile key={card.id} card={card} quantity={card.quantity} />}
            />
          )}
        </TabsPanel>
        <TabsPanel value="stats">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Pokémon by type</h2>
              <TypeChart tallies={summary.byType} />
            </section>
            <div className="flex flex-col gap-10">
              <TallyList
                title="Card kinds"
                tallies={summary.byCategory.map((t) => ({
                  ...t,
                  label: CATEGORY_LABELS[t.label as CardCategory] ?? t.label,
                }))}
              />
              <TallyList title="Biggest sets" tallies={summary.topSets} />
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-semibold text-paper-dim">{label}</dt>
      <dd className="font-numerals text-6xl leading-none sm:text-7xl">{formatCount(value)}</dd>
    </div>
  )
}

function TallyList({ title, tallies }: { title: string; tallies: ReadonlyArray<{ label: string; count: number }> }) {
  if (tallies.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        {tallies.map((t) => (
          <li key={t.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="truncate font-semibold">{t.label}</span>
            <span className="font-numerals text-2xl leading-none">{formatCount(t.count)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
