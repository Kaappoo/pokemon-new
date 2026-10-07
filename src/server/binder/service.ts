import { and, desc, eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { optionalUser, requireUser } from '../current-user.ts'
import type { CardSummary } from '../catalog/service.ts'
import { Db } from '../db/client.ts'
import { cards, collectionItems, sets, user, wishlistItems } from '../db/schema.ts'
import { NotFound } from '../errors.ts'

export interface BinderCard extends CardSummary {
  readonly addedAt: number
}

export interface CollectionCard extends BinderCard {
  readonly quantity: number
}

/** Where a card stands in the signed-in user's binder. Null for anonymous visitors. */
export interface CardStatus {
  readonly wanted: boolean
  readonly quantity: number
}

const summaryColumns = {
  id: cards.id,
  localId: cards.localId,
  name: cards.name,
  image: cards.image,
  setId: cards.setId,
  setName: sets.name,
}

const toBinderCard = (row: {
  id: string
  localId: string
  name: string
  image: string | null
  setId: string
  setName: string
  addedAt: Date
}): BinderCard => ({ ...row, image: row.image || null, addedAt: row.addedAt.getTime() })

const make = Effect.gen(function* () {
  const db = yield* Db

  const ensureCard = Effect.fn('BinderService.ensureCard')(function* (cardId: string) {
    const [row] = yield* db.query((d) => d.select({ id: cards.id }).from(cards).where(eq(cards.id, cardId)).limit(1))
    if (!row) return yield* new NotFound({ entity: 'Card', id: cardId })
  })

  const wishlist = Effect.fn('BinderService.wishlist')(function* () {
    const me = yield* requireUser
    const rows = yield* db.query((d) =>
      d
        .select({ ...summaryColumns, addedAt: wishlistItems.createdAt })
        .from(wishlistItems)
        .innerJoin(cards, eq(cards.id, wishlistItems.cardId))
        .innerJoin(sets, eq(sets.id, cards.setId))
        .where(eq(wishlistItems.userId, me.id))
        .orderBy(desc(wishlistItems.createdAt)),
    )
    return rows.map(toBinderCard)
  })

  const setWanted = Effect.fn('BinderService.setWanted')(function* (cardId: string, wanted: boolean) {
    const me = yield* requireUser
    if (wanted) {
      yield* ensureCard(cardId)
      yield* db.query((d) => d.insert(wishlistItems).values({ userId: me.id, cardId }).onConflictDoNothing())
    } else {
      yield* db.query((d) =>
        d.delete(wishlistItems).where(and(eq(wishlistItems.userId, me.id), eq(wishlistItems.cardId, cardId))),
      )
    }
    return { cardId, wanted }
  })

  const collectionOf = (owner: string) =>
    db.query((d) =>
      d
        .select({ ...summaryColumns, addedAt: collectionItems.updatedAt, quantity: collectionItems.quantity })
        .from(collectionItems)
        .innerJoin(cards, eq(cards.id, collectionItems.cardId))
        .innerJoin(sets, eq(sets.id, cards.setId))
        .where(eq(collectionItems.userId, owner))
        .orderBy(desc(collectionItems.updatedAt)),
    ).pipe(Effect.map((rows) => rows.map((row): CollectionCard => ({ ...toBinderCard(row), quantity: row.quantity }))))

  const collection = Effect.fn('BinderService.collection')(function* () {
    const me = yield* requireUser
    return yield* collectionOf(me.id)
  })

  /** Collections are public, like a binder on the table at the shop: anyone can look through it. */
  const publicCollection = Effect.fn('BinderService.publicCollection')(function* (username: string) {
    const [owner] = yield* db.query((d) =>
      d
        .select({ id: user.id })
        .from(user)
        .where(eq(sql`lower(${user.username})`, username.toLowerCase()))
        .limit(1),
    )
    if (!owner) return yield* new NotFound({ entity: 'Collector', id: username })
    return yield* collectionOf(owner.id)
  })

  const setQuantity = Effect.fn('BinderService.setQuantity')(function* (cardId: string, quantity: number) {
    const me = yield* requireUser
    const mine = and(eq(collectionItems.userId, me.id), eq(collectionItems.cardId, cardId))
    if (quantity <= 0) {
      yield* db.query((d) => d.delete(collectionItems).where(mine))
      return { cardId, quantity: 0 }
    }
    yield* ensureCard(cardId)
    yield* db.query((d) =>
      d
        .insert(collectionItems)
        .values({ userId: me.id, cardId, quantity })
        .onConflictDoUpdate({ target: [collectionItems.userId, collectionItems.cardId], set: { quantity } }),
    )
    // Most people add a card they were hunting for: it's no longer wanted.
    yield* db.query((d) =>
      d.delete(wishlistItems).where(and(eq(wishlistItems.userId, me.id), eq(wishlistItems.cardId, cardId))),
    )
    return { cardId, quantity }
  })

  const status = Effect.fn('BinderService.status')(function* (cardId: string) {
    const me = yield* optionalUser
    if (!me) return null
    const [[wanted], [owned]] = yield* Effect.all(
      [
        db.query((d) =>
          d
            .select({ cardId: wishlistItems.cardId })
            .from(wishlistItems)
            .where(and(eq(wishlistItems.userId, me.id), eq(wishlistItems.cardId, cardId))),
        ),
        db.query((d) =>
          d
            .select({ quantity: collectionItems.quantity })
            .from(collectionItems)
            .where(and(eq(collectionItems.userId, me.id), eq(collectionItems.cardId, cardId))),
        ),
      ],
      { concurrency: 'unbounded' },
    )
    return { wanted: Boolean(wanted), quantity: owned?.quantity ?? 0 } satisfies CardStatus
  })

  return { wishlist, setWanted, collection, publicCollection, setQuantity, status }
})

export class BinderService extends Context.Service<BinderService, Effect.Success<typeof make>>()(
  'pokemon-new/server/binder/BinderService',
) {
  static readonly layer = Layer.effect(BinderService, make)
}
