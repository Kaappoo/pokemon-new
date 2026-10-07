import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'
import { asUser, insertUser, seedCatalog, withDb } from '../testing.ts'
import { BinderService } from './service.ts'

const TestLayer = withDb(BinderService.layer)

describe('BinderService', () => {
  it.effect('adds and removes wishlist cards', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const binder = yield* BinderService
      const me = yield* insertUser('Misty')
      yield* binder.setWanted('base1-4', true).pipe(asUser(me))
      yield* binder.setWanted('base1-4', true).pipe(asUser(me))
      expect((yield* binder.wishlist().pipe(asUser(me))).map((c) => c.name)).toEqual(['Charizard'])
      yield* binder.setWanted('base1-4', false).pipe(asUser(me))
      expect(yield* binder.wishlist().pipe(asUser(me))).toEqual([])
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('tracks copies, drops a card at zero, and stops wanting cards you now own', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const binder = yield* BinderService
      const me = yield* insertUser('Brock')
      yield* binder.setWanted('base1-58', true).pipe(asUser(me))
      yield* binder.setQuantity('base1-58', 2).pipe(asUser(me))

      expect(yield* binder.status('base1-58').pipe(asUser(me))).toEqual({ wanted: false, quantity: 2 })
      expect((yield* binder.collection().pipe(asUser(me)))[0]).toMatchObject({ name: 'Pikachu', quantity: 2 })

      yield* binder.setQuantity('base1-58', 0).pipe(asUser(me))
      expect(yield* binder.collection().pipe(asUser(me))).toEqual([])
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('requires sign-in to change anything and rejects unknown cards', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const binder = yield* BinderService
      expect((yield* Effect.flip(binder.setWanted('base1-4', true)))._tag).toBe('Unauthenticated')
      expect(yield* binder.status('base1-4')).toBeNull()
      const me = yield* insertUser('Gary')
      expect((yield* Effect.flip(binder.setQuantity('fake-1', 1).pipe(asUser(me))))._tag).toBe('NotFound')
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('shows anyone a collector’s binder by username', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const binder = yield* BinderService
      const me = yield* insertUser('Erika')
      yield* binder.setQuantity('base1-10', 1).pipe(asUser(me))
      const theirs = yield* binder.publicCollection(me.username!.toUpperCase())
      expect(theirs.map((c) => c.name)).toEqual(['Mewtwo'])
      expect((yield* Effect.flip(binder.publicCollection('nobody')))._tag).toBe('NotFound')
    }).pipe(Effect.provide(TestLayer)),
  )
})
