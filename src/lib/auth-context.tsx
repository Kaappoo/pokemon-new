import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, authApi, wishlistApi, WishlistItem } from './api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  wishlist: WishlistItem[]
  wishlistCardIds: Set<string>
  login: (token: string, user: User) => void
  logout: () => void
  refreshProfile: () => Promise<void>
  toggleWishlist: (card: { card_id: string; card_name: string; card_image: string; set_id?: string; set_name?: string }) => Promise<boolean>
  isInWishlist: (cardId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('poke_auth_token')
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [wishlistCardIds, setWishlistCardIds] = useState<Set<string>>(new Set())

  const updateWishlistState = (items: WishlistItem[]) => {
    setWishlist(items)
    setWishlistCardIds(new Set(items.map((i) => i.card_id)))
  }

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null)
      setWishlist([])
      setWishlistCardIds(new Set())
      setIsLoading(false)
      return
    }

    try {
      const data = await authApi.getProfile()
      setUser(data.user)
      updateWishlistState(data.wishlist || [])
    } catch (err) {
      console.warn('Session expired or backend unavailable:', err)
      // Clear token if invalid profile
      localStorage.removeItem('poke_auth_token')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('poke_auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
    refreshProfile()
  }

  const logout = () => {
    localStorage.removeItem('poke_auth_token')
    setToken(null)
    setUser(null)
    setWishlist([])
    setWishlistCardIds(new Set())
  }

  const isInWishlist = (cardId: string): boolean => {
    return wishlistCardIds.has(cardId)
  }

  const toggleWishlist = async (card: { card_id: string; card_name: string; card_image: string; set_id?: string; set_name?: string }): Promise<boolean> => {
    if (!user || !token) {
      throw new Error('Please login to manage your wishlist')
    }

    const currentlyInWishlist = isInWishlist(card.card_id)

    if (currentlyInWishlist) {
      // Optimistic update
      const updatedWishlist = wishlist.filter((item) => item.card_id !== card.card_id)
      updateWishlistState(updatedWishlist)
      
      try {
        await wishlistApi.removeFromWishlist(card.card_id)
        return false
      } catch (error) {
        // Rollback
        refreshProfile()
        throw error
      }
    } else {
      // Optimistic update
      const tempItem: WishlistItem = {
        id: Date.now(),
        user_id: user.id,
        card_id: card.card_id,
        card_name: card.card_name,
        card_image: card.card_image,
        set_id: card.set_id || '',
        set_name: card.set_name || '',
        created_at: new Date().toISOString(),
      }
      updateWishlistState([tempItem, ...wishlist])

      try {
        const added = await wishlistApi.addToWishlist(card)
        setWishlist((prev) => prev.map((item) => (item.card_id === card.card_id ? added : item)))
        return true
      } catch (error) {
        // Rollback
        refreshProfile()
        throw error
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        wishlist,
        wishlistCardIds,
        login,
        logout,
        refreshProfile,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
