import { eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { summarizeBinder, type BinderSummary } from '#/domain/binder.ts'
import type { ProfileInput } from '#/shared/schemas.ts'
import { requireUser } from '../current-user.ts'
import { Db } from '../db/client.ts'
import { cards, collectionItems, sets, user } from '../db/schema.ts'
import { InvalidState, NotFound } from '../errors.ts'

export interface PublicProfile {
  readonly user: {
    readonly id: string
    readonly name: string
    readonly username: string
    readonly image: string | null
    readonly bio: string | null
    readonly favoriteCard: string | null
    readonly joinedAt: number
  }
  readonly summary: BinderSummary
}

const byUsernameWhere = (username: string) => eq(sql`lower(${user.username})`, username.toLowerCase())

const make = Effect.gen(function* () {
  const db = yield* Db

  const byUsername = Effect.fn('ProfilesService.byUsername')(function* (username: string) {
    const row = yield* db.query((d) => d.query.user.findFirst({ where: byUsernameWhere(username) }))
    if (!row?.username) return yield* new NotFound({ entity: 'Collector', id: username })

    const entries = yield* db.query((d) =>
      d
        .select({
          quantity: collectionItems.quantity,
          category: cards.category,
          types: cards.types,
          rarity: cards.rarity,
          setId: sets.id,
          setName: sets.name,
        })
        .from(collectionItems)
        .innerJoin(cards, eq(cards.id, collectionItems.cardId))
        .innerJoin(sets, eq(sets.id, cards.setId))
        .where(eq(collectionItems.userId, row.id)),
    )

    return {
      user: {
        id: row.id,
        name: row.name,
        username: row.displayUsername ?? row.username,
        image: row.image,
        bio: row.bio,
        favoriteCard: row.favoriteCard,
        joinedAt: row.createdAt.getTime(),
      },
      summary: summarizeBinder(entries),
    } satisfies PublicProfile
  })

  const me = Effect.fn('ProfilesService.me')(function* () {
    const current = yield* requireUser
    const row = yield* db.query((d) => d.query.user.findFirst({ where: eq(user.id, current.id) }))
    if (!row) return yield* new NotFound({ entity: 'Collector', id: current.id })
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.displayUsername ?? row.username,
      image: row.image,
      bio: row.bio,
      favoriteCard: row.favoriteCard,
    }
  })

  const updateMine = Effect.fn('ProfilesService.updateMine')(function* (input: ProfileInput) {
    const me = yield* requireUser
    const taken = yield* db.query((d) => d.query.user.findFirst({ where: byUsernameWhere(input.username) }))
    if (taken && taken.id !== me.id) return yield* new InvalidState({ reason: 'That username is taken' })
    yield* db.query((d) =>
      d
        .update(user)
        .set({
          name: input.name,
          username: input.username.toLowerCase(),
          displayUsername: input.username,
          bio: input.bio || null,
          favoriteCard: input.favoriteCard || null,
          ...(input.image !== undefined ? { image: input.image || null } : {}),
        })
        .where(eq(user.id, me.id)),
    )
    return { username: input.username.toLowerCase() }
  })

  return { byUsername, me, updateMine }
})

export class ProfilesService extends Context.Service<ProfilesService, Effect.Success<typeof make>>()(
  'pokemon-new/server/profiles/ProfilesService',
) {
  static readonly layer = Layer.effect(ProfilesService, make)
}
