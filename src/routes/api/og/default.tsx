import { createFileRoute } from '@tanstack/react-router'
import { OgFrame, ogResponse, palette, renderOgImage } from '#/server/og/render.tsx'

export const Route = createFileRoute('/api/og/default')({
  server: {
    handlers: {
      GET: async () => {
        const png = await renderOgImage(
          <OgFrame footer={<span>Every Pokémon TCG card.</span>}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Archivo Black',
                fontSize: 104,
                lineHeight: 0.92,
                letterSpacing: -2,
                marginTop: 40,
              }}
            >
              <span>Look it up.</span>
              <span>Collect it.</span>
              <span style={{ color: palette.orange }}>Want it.</span>
            </div>
          </OgFrame>,
        )
        return ogResponse(png, 86_400)
      },
    },
  },
})
