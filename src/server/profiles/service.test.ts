import { describe, expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { BinderService } from '../binder/service.ts'
import { asUser, insertUser, seedCatalog, withDb } from '../testing.ts'
import { ProfilesService } from './service.ts'

const TestLayer = withDb(Layer.mergeAll(ProfilesService.layer, BinderService.layer))

describe('ProfilesService', () => {
  it.effect('summarises a collector’s binder on their public profile', () =>
    Effect.gen(function* () {
      yield* seedCatalog()
      const binder = yield* BinderService
      const profiles = yield* ProfilesService
      const me = yield* insertUser('Sabrina')
      yield* binder.setQuantity('base1-10', 3).pipe(asUser(me))
      yield* binder.setQuantity('base1-4', 1).pipe(asUser(me))

      const profile = yield* profiles.byUsername(me.username!)
      expect(profile.user.name).toBe('Sabrina')
      expect(profile.summary).toMatchObject({ unique: 2, copies: 4, sets: 1 })
      expect(profile.summary.byType).toEqual([
        { label: 'Psychic', count: 3 },
        { label: 'Fire', count: 1 },
      ])
    }).pipe(Effect.provide(TestLayer)),
  )

  it.effect('updates the profile and refuses a username someone else has', () =>
    Effect.gen(function* () {
      const profiles = yield* ProfilesService
      const me = yield* insertUser('Koga')
      const other = yield* insertUser('Janine')
      const base = { name: 'Koga', bio: 'Poison specialist', favoriteCard: 'Weezing' }

      const error = yield* Effect.flip(profiles.updateMine({ ...base, username: other.username! }).pipe(asUser(me)))
      expect(error._tag).toBe('InvalidState')

      yield* profiles.updateMine({ ...base, username: 'Fuchsia_Koga' }).pipe(asUser(me))
      expect(yield* profiles.me().pipe(asUser(me))).toMatchObject({
        username: 'Fuchsia_Koga',
        bio: 'Poison specialist',
        favoriteCard: 'Weezing',
      })
      expect((yield* profiles.byUsername('fuchsia_koga')).user.username).toBe('Fuchsia_Koga')
    }).pipe(Effect.provide(TestLayer)),
  )
})
