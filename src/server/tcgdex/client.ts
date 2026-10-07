import { Context, Effect, Layer, Schema } from 'effect'
import { SetResume, TcgdexCard, TcgdexSet } from '#/domain/tcgdex.ts'
import { NotFound, UpstreamError } from '../errors.ts'

export const TCGDEX_API = 'https://api.tcgdex.net/v2/en'

/** A decoded payload plus the exact JSON TCGdex returned, which is what gets stored. */
export interface Fetched<A> {
  readonly value: A
  readonly raw: unknown
}

const decodeSetList = Schema.decodeUnknownEffect(Schema.Array(SetResume))
const decodeSet = Schema.decodeUnknownEffect(TcgdexSet)
const decodeCard = Schema.decodeUnknownEffect(TcgdexCard)

const getJson = (url: string, entity: string, id: string): Effect.Effect<unknown, UpstreamError | NotFound> =>
  Effect.tryPromise({
    try: (signal) => fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]) }),
    catch: (cause) => new UpstreamError({ url, cause }),
  }).pipe(
    Effect.flatMap((response): Effect.Effect<unknown, UpstreamError | NotFound> => {
      if (response.status === 404) return Effect.fail(new NotFound({ entity, id }))
      if (!response.ok) return Effect.fail(new UpstreamError({ url, status: response.status }))
      return Effect.tryPromise({
        try: () => response.json() as Promise<unknown>,
        catch: (cause) => new UpstreamError({ url, cause }),
      })
    }),
  )

const fetchDecoded = <A>(
  path: string,
  entity: string,
  id: string,
  decode: (raw: unknown) => Effect.Effect<A, unknown>,
): Effect.Effect<Fetched<A>, UpstreamError | NotFound> => {
  const url = `${TCGDEX_API}${path}`
  return getJson(url, entity, id).pipe(
    Effect.flatMap((raw) =>
      decode(raw).pipe(
        Effect.map((value) => ({ value, raw })),
        Effect.mapError((cause) => new UpstreamError({ url, cause })),
      ),
    ),
  )
}

/**
 * TCGdex (https://tcgdex.dev): free, open-source, no API key. The only place
 * the server talks to it; tests swap this layer for an in-memory fake.
 */
export class Tcgdex extends Context.Service<
  Tcgdex,
  {
    listSets(): Effect.Effect<ReadonlyArray<SetResume>, UpstreamError>
    getSet(id: string): Effect.Effect<Fetched<TcgdexSet>, UpstreamError | NotFound>
    getCard(id: string): Effect.Effect<Fetched<TcgdexCard>, UpstreamError | NotFound>
  }
>()('pokemon-new/server/tcgdex/Tcgdex') {
  static readonly layer = Layer.succeed(
    Tcgdex,
    Tcgdex.of({
      listSets: () =>
        fetchDecoded('/sets', 'Set list', 'all', decodeSetList).pipe(
          Effect.map(({ value }) => value),
          // The set list itself missing means TCGdex is broken, not that a record doesn't exist.
          Effect.mapError((error) =>
            error._tag === 'NotFound' ? new UpstreamError({ url: `${TCGDEX_API}/sets`, status: 404 }) : error,
          ),
        ),
      getSet: (id) => fetchDecoded(`/sets/${encodeURIComponent(id)}`, 'Set', id, decodeSet),
      getCard: (id) => fetchDecoded(`/cards/${encodeURIComponent(id)}`, 'Card', id, decodeCard),
    }),
  )
}
