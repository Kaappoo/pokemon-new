import { useAuth } from '../lib/auth-context'

export function useWishlist() {
  const { wishlist, wishlistCardIds, toggleWishlist, isInWishlist, refreshProfile, user } = useAuth()

  return {
    wishlist,
    count: wishlist.length,
    wishlistCardIds,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: refreshProfile,
    isLoggedIn: !!user,
  }
}
