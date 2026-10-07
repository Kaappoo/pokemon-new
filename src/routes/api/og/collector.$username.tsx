import { createFileRoute } from '@tanstack/react-router'
import { Effect, Option } from 'effect'
import { formatCount } from '#/lib/format.ts'
import { OgFrame, OgStat, ogResponse, palette, renderOgImage } from '#/server/og/render.tsx'
import { ProfilesService } from '#/server/profiles/service.ts'
import { runtime } from '#/server/runtime.ts'

export const Route = createFileRoute('/api/og/collector/$username')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const profile = await runtime.runPromise(
          ProfilesService.use((s) => s.byUsername(params.username)).pipe(Effect.option, Effect.map(Option.getOrNull)),
        )
        if (!profile) return new Response('Not found', { status: 404 })
        const { user, summary } = profile

        const png = await renderOgImage(
          <OgFrame footer={<span>@{user.username}</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
              <div style={{ fontSize: 28, color: palette.muted, fontWeight: 800 }}>Collector</div>
              <div
                style={{
                  fontFamily: 'Archivo Black',
                  fontSize: user.name.length > 16 ? 80 : 104,
                  lineHeight: 0.95,
                  letterSpacing: -2,
                  marginTop: 16,
                }}
              >
                {user.name}
              </div>
              <div style={{ display: 'flex', marginTop: 52 }}>
                <OgStat value={formatCount(summary.unique)} label="Cards" />
                <OgStat value={formatCount(summary.copies)} label="Copies" />
                <OgStat value={formatCount(summary.sets)} label="Sets" />
              </div>
            </div>
          </OgFrame>,
        )
        return ogResponse(png, 3_600)
      },
    },
  },
})
