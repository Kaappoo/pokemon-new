import { createServerFn } from '@tanstack/react-start'
import { cardIdInput, quantityInput, wishlistInput } from '#/shared/schemas.ts'
import { BinderService } from '../binder/service.ts'
import { runServerEffect } from '../effect/run.ts'

export const getWishlist = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(BinderService.use((s) => s.wishlist())),
)

export const getMyCollection = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(BinderService.use((s) => s.collection())),
)

export const getCardStatus = createServerFn({ method: 'GET' })
  .validator(cardIdInput)
  .handler(({ data }) => runServerEffect(BinderService.use((s) => s.status(data.cardId))))

export const setWanted = createServerFn({ method: 'POST' })
  .validator(wishlistInput)
  .handler(({ data }) => runServerEffect(BinderService.use((s) => s.setWanted(data.cardId, data.wanted))))

export const setQuantity = createServerFn({ method: 'POST' })
  .validator(quantityInput)
  .handler(({ data }) => runServerEffect(BinderService.use((s) => s.setQuantity(data.cardId, data.quantity))))
