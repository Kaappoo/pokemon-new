import { createServerFn } from '@tanstack/react-start'
import { cardIdInput, cardSearchInput, setIdInput, setsInput } from '#/shared/schemas.ts'
import { CatalogService } from '../catalog/service.ts'
import { runServerEffect } from '../effect/run.ts'

export const getCatalogHome = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(CatalogService.use((s) => s.home())),
)

export const listSets = createServerFn({ method: 'GET' })
  .validator(setsInput)
  .handler(({ data }) => runServerEffect(CatalogService.use((s) => s.listSets(data))))

export const getSet = createServerFn({ method: 'GET' })
  .validator(setIdInput)
  .handler(({ data }) => runServerEffect(CatalogService.use((s) => s.getSet(data.setId))))

export const searchCards = createServerFn({ method: 'GET' })
  .validator(cardSearchInput)
  .handler(({ data }) => runServerEffect(CatalogService.use((s) => s.searchCards(data))))

export const getCard = createServerFn({ method: 'GET' })
  .validator(cardIdInput)
  .handler(({ data }) => runServerEffect(CatalogService.use((s) => s.getCard(data.cardId))))

export const listTypes = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(CatalogService.use((s) => s.types())),
)
