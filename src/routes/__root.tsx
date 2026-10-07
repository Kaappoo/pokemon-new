import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { BottomNav } from '#/components/layout/bottom-nav.tsx'
import { Devtools } from '#/components/layout/devtools.tsx'
import { SiteHeader } from '#/components/layout/site-header.tsx'
import { Toaster } from '#/components/ui/toast.tsx'
import { startQueryPersistence } from '#/lib/persist.ts'
import { sessionQuery } from '#/lib/queries.ts'
import { registerServiceWorker } from '#/lib/register-sw.ts'
import { absoluteUrl, seo, SITE_NAME } from '#/lib/seo.ts'
import type { SessionUser } from '#/server/current-user.ts'
import appCss from '#/styles/app.css?url'

interface RouterContext {
  queryClient: QueryClient
  user: SessionUser | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQuery)
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#0b0b0c' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ...seo({
        title: `${SITE_NAME} — every Pokémon TCG card, one binder`,
        description:
          'Browse every physical Pokémon TCG set and card, track the copies you own and keep a wishlist. Pokémon TCG Pocket stays separate.',
        image: absoluteUrl('/api/og/default'),
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      { rel: 'preconnect', href: 'https://assets.tcgdex.net' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const { queryClient } = Route.useRouteContext()
  useEffect(() => startQueryPersistence(queryClient), [queryClient])
  useEffect(() => registerServiceWorker(), [])
  // Lets e2e tests (and CSS, if ever needed) know the page is interactive.
  useEffect(() => document.documentElement.setAttribute('data-hydrated', ''), [])

  return (
    <Toaster>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-orange focus:px-4 focus:py-2 focus:text-on-orange"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 pb-28 md:pb-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </Toaster>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Devtools />
        <Scripts />
      </body>
    </html>
  )
}
