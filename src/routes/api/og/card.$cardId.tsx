import { createFileRoute } from '@tanstack/react-router'
import { Effect, Option } from 'effect'
import { cardImagePng, printedNumber } from '#/domain/catalog.ts'
import { CatalogService } from '#/server/catalog/service.ts'
import { OgFrame, OgStat, ogResponse, palette, renderOgImage } from '#/server/og/render.tsx'
import { runtime } from '#/server/runtime.ts'

export const Route = createFileRoute('/api/og/card/$cardId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const view = await runtime.runPromise(
          CatalogService.use((s) => s.getCard(params.cardId)).pipe(Effect.option, Effect.map(Option.getOrNull)),
        )
        if (!view) return new Response('Not found', { status: 404 })
        const { card, set } = view
        const art = cardImagePng(card.image)

        const png = await renderOgImage(
          <OgFrame
            footer={<span>{set.name}</span>}
            art={
              art ? (
                <img
                  src={art}
                  width={340}
                  height={474}
                  style={{ borderRadius: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
                />
              ) : undefined
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, maxWidth: art ? 640 : 760 }}>
              <div style={{ fontSize: 28, color: palette.muted, fontWeight: 800 }}>{set.serieName}</div>
              <div
                style={{
                  fontFamily: 'Archivo Black',
                  fontSize: card.name.length > 16 ? 72 : 96,
                  lineHeight: 0.95,
                  letterSpacing: -2,
                  marginTop: 16,
                }}
              >
                {card.name}
              </div>
              <div style={{ display: 'flex', marginTop: 44 }}>
                <OgStat value={`#${printedNumber(card.localId, set.official)}`} label="Number" />
                {card.hp ? <OgStat value={String(card.hp)} label="HP" /> : null}
                {card.rarity ? <OgStat value={card.rarity} label="Rarity" /> : null}
              </div>
            </div>
          </OgFrame>,
        )
        return ogResponse(png, 86_400)
      },
    },
  },
})
