import { createServerFn } from '@tanstack/react-start'
import { profileInput, usernameInput } from '#/shared/schemas.ts'
import { BinderService } from '../binder/service.ts'
import { runServerEffect } from '../effect/run.ts'
import { ProfilesService } from '../profiles/service.ts'

export const getProfile = createServerFn({ method: 'GET' })
  .validator(usernameInput)
  .handler(({ data }) => runServerEffect(ProfilesService.use((s) => s.byUsername(data.username))))

/** A collector's binder, visible on their public profile. */
export const getProfileCollection = createServerFn({ method: 'GET' })
  .validator(usernameInput)
  .handler(({ data }) => runServerEffect(BinderService.use((s) => s.publicCollection(data.username))))

export const getMyProfile = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(ProfilesService.use((s) => s.me())),
)

export const updateProfile = createServerFn({ method: 'POST' })
  .validator(profileInput)
  .handler(({ data }) => runServerEffect(ProfilesService.use((s) => s.updateMine(data))))
