import TCGdex, { Query } from '@tcgdex/sdk'

const tcgdex = new TCGdex('en')

export default tcgdex
export { Query }

// ── Poké Cards Backend API Client ─────────────────────────────
const API_BASE_URL = 'http://localhost:8080/api'

export interface User {
  id: number
  username: string
  email: string
  bio?: string
  avatar_url?: string
  favorite_card?: string
  created_at: string
}

export interface WishlistItem {
  id: number
  user_id: number
  card_id: string
  card_name: string
  card_image: string
  set_id?: string
  set_name?: string
  created_at: string
}

export interface CollectionItem {
  id: number
  user_id: number
  card_id: string
  card_name: string
  card_image: string
  set_id?: string
  set_name?: string
  quantity: number
  rarity?: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface UserProfileResponse {
  user: User
  wishlist_count: number
  collection_count: number
  wishlist: WishlistItem[]
  collection: CollectionItem[]
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('poke_auth_token')
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }

  return data as T
}

// Auth API calls
export const authApi = {
  register: (payload: { username: string; email: string; password: string }) =>
    fetchApi<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { username_or_email: string; password: string }) =>
    fetchApi<AuthResponse>('/login', { method: 'POST', body: JSON.stringify(payload) }),

  getProfile: () => fetchApi<UserProfileResponse>('/user/profile'),

  updateProfile: (payload: { bio?: string; avatar_url?: string; favorite_card?: string }) =>
    fetchApi<User>('/user/profile', { method: 'PUT', body: JSON.stringify(payload) }),
}

// Wishlist API calls
export const wishlistApi = {
  getWishlist: () => fetchApi<WishlistItem[]>('/wishlist'),

  addToWishlist: (payload: { card_id: string; card_name: string; card_image: string; set_id?: string; set_name?: string }) =>
    fetchApi<WishlistItem>('/wishlist', { method: 'POST', body: JSON.stringify(payload) }),

  removeFromWishlist: (cardId: string) =>
    fetchApi<{ success: boolean }>('/wishlist', { method: 'DELETE', body: JSON.stringify({ card_id: cardId }) }),

  checkWishlist: (cardId: string) =>
    fetchApi<{ card_id: string; in_wishlist: boolean }>(`/wishlist/check?card_id=${encodeURIComponent(cardId)}`),
}

// Collection API calls
export const collectionApi = {
  getCollection: () => fetchApi<CollectionItem[]>('/collection'),

  addToCollection: (payload: { card_id: string; card_name: string; card_image: string; set_id?: string; set_name?: string; quantity?: number; rarity?: string }) =>
    fetchApi<CollectionItem>('/collection', { method: 'POST', body: JSON.stringify(payload) }),

  removeFromCollection: (cardId: string) =>
    fetchApi<{ success: boolean }>(`/collection?card_id=${encodeURIComponent(cardId)}`, { method: 'DELETE' }),
}
