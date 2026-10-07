import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { getCardStatus, getMyCollection, getWishlist } from '#/server/functions/binder.ts'
import { getCard, getCatalogHome, getSet, listSets, listTypes, searchCards } from '#/server/functions/catalog.ts'
import { getMyProfile, getProfile, getProfileCollection } from '#/server/functions/profiles.ts'
import { getSessionUser } from '#/server/functions/session.ts'
import type { CardSearchParams } from '#/shared/schemas.ts'

/** Queries flagged with `meta.persist` survive reloads and offline use (see lib/persist.ts). */
const persist = { persist: true } as const
const MINUTE = 60_000

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: () => getSessionUser(),
  staleTime: MINUTE,
})

/* ---------------------------------------------------------------- */
/* Catalog — changes once a night when the sync runs.               */
/* ---------------------------------------------------------------- */

export const homeQuery = queryOptions({
  queryKey: ['catalog', 'home'],
  queryFn: () => getCatalogHome(),
  meta: persist,
  staleTime: 10 * MINUTE,
})

export const setsQuery = (includePocket = false) =>
  queryOptions({
    queryKey: ['catalog', 'sets', includePocket],
    queryFn: () => listSets({ data: { includePocket } }),
    meta: persist,
    staleTime: 30 * MINUTE,
  })

export const setQuery = (setId: string) =>
  queryOptions({
    queryKey: ['catalog', 'set', setId],
    queryFn: () => getSet({ data: { setId } }),
    meta: persist,
    staleTime: 30 * MINUTE,
  })

export const typesQuery = queryOptions({
  queryKey: ['catalog', 'types'],
  queryFn: () => listTypes(),
  meta: persist,
  staleTime: 60 * MINUTE,
})

export const cardsQuery = (params: CardSearchParams) =>
  infiniteQueryOptions({
    queryKey: ['catalog', 'cards', params],
    queryFn: ({ pageParam }) =>
      searchCards({
        data: {
          q: params.q || undefined,
          set: params.set,
          type: params.type,
          category: params.category,
          includePocket: params.pocket ?? false,
          page: pageParam,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 5 * MINUTE,
  })

export const cardQuery = (cardId: string) =>
  queryOptions({
    queryKey: ['catalog', 'card', cardId],
    queryFn: () => getCard({ data: { cardId } }),
    meta: persist,
    staleTime: 30 * MINUTE,
  })

/* ---------------------------------------------------------------- */
/* Binder — the signed-in collector's wishlist and collection.       */
/* ---------------------------------------------------------------- */

export const cardStatusQuery = (cardId: string) =>
  queryOptions({
    queryKey: ['binder', 'status', cardId],
    queryFn: () => getCardStatus({ data: { cardId } }),
    staleTime: MINUTE,
  })

export const wishlistQuery = queryOptions({
  queryKey: ['binder', 'wishlist'],
  queryFn: () => getWishlist(),
  meta: persist,
  staleTime: MINUTE,
})

export const collectionQuery = queryOptions({
  queryKey: ['binder', 'collection'],
  queryFn: () => getMyCollection(),
  meta: persist,
  staleTime: MINUTE,
})

/* ---------------------------------------------------------------- */
/* Profiles                                                          */
/* ---------------------------------------------------------------- */

export const profileQuery = (username: string) =>
  queryOptions({
    queryKey: ['profile', username.toLowerCase()],
    queryFn: () => getProfile({ data: { username } }),
    meta: persist,
    staleTime: MINUTE,
  })

export const profileCollectionQuery = (username: string) =>
  queryOptions({
    queryKey: ['profile', username.toLowerCase(), 'collection'],
    queryFn: () => getProfileCollection({ data: { username } }),
    staleTime: MINUTE,
  })

export const myProfileQuery = queryOptions({
  queryKey: ['profile', 'me'],
  queryFn: () => getMyProfile(),
  staleTime: MINUTE,
})
