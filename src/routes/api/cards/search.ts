import { createFileRoute } from '@tanstack/react-router'
import { cardImageUrl } from '#/domain/catalog.ts'
import { CatalogService } from '#/server/catalog/service.ts'
import { runtime } from '#/server/runtime.ts'
import { pokemonSearchQuery } from '#/shared/schemas.ts'

/**
 * Pokémon card search for other apps (tcgRank's partner Pokémon picker):
 * `GET /api/cards/search?q=pikachu&page=1&perPage=24`. Always Pokémon only, never Pocket cards, newest sets first.
 * Cards added since the last nightly sync have no category yet, so they show up after the next one.
 */
export const Route = createFileRoute('/api/cards/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams)
        const input = pokemonSearchQuery.safeParse(params)
        if (!input.success) {
          return Response.json({ error: 'Expected ?q= with at least 2 characters' }, { status: 400 })
        }
        const page = await runtime.runPromise(
          CatalogService.use((s) => s.searchCards({ ...input.data, category: 'Pokemon', includePocket: false })),
        )
        return Response.json(
          {
            cards: page.cards.map((c) => ({
              id: c.id,
              name: c.name,
              setId: c.setId,
              setName: c.setName,
              localId: c.localId,
              small: cardImageUrl(c.image, 'low'),
              large: cardImageUrl(c.image, 'high'),
            })),
            total: page.total,
            nextPage: page.nextPage,
          },
          // Results only change with the nightly sync.
          { headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' } },
        )
      },
    },
  },
})
