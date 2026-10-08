import { createFileRoute } from '@tanstack/react-router'
import { cardImageUrl } from '#/domain/catalog.ts'
import { CatalogService } from '#/server/catalog/service.ts'
import { runtime } from '#/server/runtime.ts'
import { liveCardLookupInput } from '#/shared/schemas.ts'

/**
 * Card art for Pokémon TCG Live deck lists, for other apps (tcgRank) that
 * don't keep their own catalog. Body: `{ cards: [{ setCode: "TWM", number: "130" }] }`.
 * Unknown cards are left out of the response.
 */
export const Route = createFileRoute('/api/cards/lookup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const input = liveCardLookupInput.safeParse(await request.json().catch(() => null))
        if (!input.success) return Response.json({ error: 'Expected { cards: [{ setCode, number }] }' }, { status: 400 })
        const matches = await runtime.runPromise(CatalogService.use((s) => s.lookupLiveCards(input.data.cards)))
        return Response.json({
          cards: matches.map((m) => ({
            setCode: m.setCode,
            number: m.number,
            id: m.id,
            name: m.name,
            small: cardImageUrl(m.image, 'low'),
            large: cardImageUrl(m.image, 'high'),
          })),
        })
      },
    },
  },
})
