import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

const ONE_DAY = 24 * 60 * 60 * 1000
export const CACHE_KEY = 'pokecards-cache'

/**
 * Persists opted-in queries (sets, cards you've opened, your wishlist and
 * collection) to localStorage. Together with the service worker this keeps
 * your binder readable at a card shop with no signal.
 */
export function startQueryPersistence(queryClient: QueryClient) {
  if (typeof window === 'undefined') return () => {}
  const persister = createSyncStoragePersister({ storage: window.localStorage, key: CACHE_KEY })
  const [unsubscribe] = persistQueryClient({
    queryClient,
    persister,
    maxAge: ONE_DAY,
    buster: 'v1',
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => query.meta?.persist === true && query.state.status === 'success',
    },
  })
  return unsubscribe
}
