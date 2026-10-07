import { Layer, ManagedRuntime } from 'effect'
import { BinderService } from './binder/service.ts'
import { CatalogService } from './catalog/service.ts'
import { Db } from './db/client.ts'
import { database } from './db/index.ts'
import { Mailer } from './email/mailer.ts'
import { ProfilesService } from './profiles/service.ts'
import { Tcgdex } from './tcgdex/client.ts'

const AppLayer = Layer.mergeAll(CatalogService.layer, BinderService.layer, ProfilesService.layer).pipe(
  Layer.provideMerge(Layer.mergeAll(Db.fromDatabase(database), Tcgdex.layer, Mailer.layer)),
  Layer.orDie,
)

export type AppServices = Layer.Success<typeof AppLayer>

const memoMap = Layer.makeMemoMapUnsafe()

/** One runtime per server process; every server function and API route runs through it. */
export const runtime = ManagedRuntime.make(AppLayer, { memoMap })
