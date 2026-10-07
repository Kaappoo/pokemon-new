/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: Array<PrecacheEntry | string> | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

/**
 * Card art is the heaviest thing on every page and it never changes once
 * published, so it is cached forever. The app shell is precached, pages fall
 * back to the last good copy, and mutations (server functions, auth) always
 * go to the network.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/auth'),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) => url.pathname.startsWith('/_serverFn') && request.method !== 'GET',
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) => url.hostname === 'assets.tcgdex.net',
      handler: new CacheFirst({
        cacheName: 'card-images',
        plugins: [new ExpirationPlugin({ maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 90 })],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/og/'),
      handler: new StaleWhileRevalidate({ cacheName: 'og-images' }),
    },
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 40 })],
      }),
    },
    {
      matcher: ({ request }) => ['style', 'script', 'font', 'image'].includes(request.destination),
      handler: new StaleWhileRevalidate({ cacheName: 'assets' }),
    },
  ],
})

serwist.addEventListeners()
