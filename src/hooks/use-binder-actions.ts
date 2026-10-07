import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from '#/components/ui/toast.tsx'
import { cardStatusQuery } from '#/lib/queries.ts'
import type { CardStatus } from '#/server/binder/service.ts'
import { setQuantity, setWanted } from '#/server/functions/binder.ts'

const message = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong')

/**
 * Wishlist and collection changes for one card. Both update the card's
 * status optimistically (the tap feels instant on store Wi-Fi) and roll back
 * if the server says no.
 */
export function useBinderActions(cardId: string) {
  const queryClient = useQueryClient()
  const statusKey = cardStatusQuery(cardId).queryKey
  const want = useServerFn(setWanted)
  const count = useServerFn(setQuantity)

  const optimistic = async (next: Partial<CardStatus>) => {
    await queryClient.cancelQueries({ queryKey: statusKey })
    const previous = queryClient.getQueryData<CardStatus | null>(statusKey)
    queryClient.setQueryData<CardStatus | null>(statusKey, (old) => (old ? { ...old, ...next } : old))
    return { previous }
  }
  const rollback = (error: unknown, _variables: unknown, snapshot: { previous?: CardStatus | null } | undefined) => {
    queryClient.setQueryData(statusKey, snapshot?.previous)
    toast.error("That didn't save", message(error))
  }
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['binder'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
    ])

  return {
    setWanted: useMutation({
      mutationFn: (wanted: boolean) => want({ data: { cardId, wanted } }),
      onMutate: (wanted) => optimistic({ wanted }),
      onError: rollback,
      onSuccess: ({ wanted }) => toast.show(wanted ? 'Added to your wishlist' : 'Removed from your wishlist'),
      onSettled: refresh,
    }),
    setQuantity: useMutation({
      mutationFn: (quantity: number) => count({ data: { cardId, quantity } }),
      // Owning a card takes it off the wishlist (the server does the same).
      onMutate: (quantity) => optimistic(quantity > 0 ? { quantity, wanted: false } : { quantity }),
      onError: rollback,
      onSettled: refresh,
    }),
  }
}
