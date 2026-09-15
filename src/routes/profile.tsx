import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { authApi, collectionApi, wishlistApi, UserProfileResponse } from '../lib/api'
import { Heart, Layers, LogOut, Edit3, Save, X, Calendar, User as UserIcon, Sparkles, Trash2, PackageOpen } from 'lucide-react'
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, logout, refreshProfile } = useAuth()

  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wishlist' | 'collection'>('wishlist')

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [favoriteCard, setFavoriteCard] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadProfile = async () => {
    if (!token) {
      navigate({ to: '/login' })
      return
    }
    setIsLoading(true)
    try {
      const data = await authApi.getProfile()
      setProfileData(data)
      setBio(data.user.bio || '')
      setFavoriteCard(data.user.favorite_card || '')
      setAvatarUrl(data.user.avatar_url || '')
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [token])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await authApi.updateProfile({
        bio,
        favorite_card: favoriteCard,
        avatar_url: avatarUrl,
      })
      await refreshProfile()
      await loadProfile()
      setIsEditing(false)
    } catch (err) {
      alert('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveWishlist = async (cardId: string) => {
    try {
      await wishlistApi.removeFromWishlist(cardId)
      await loadProfile()
      await refreshProfile()
    } catch (err) {
      alert('Failed to remove from wishlist')
    }
  }

  const handleRemoveCollection = async (cardId: string) => {
    try {
      await collectionApi.removeFromCollection(cardId)
      await loadProfile()
    } catch (err) {
      alert('Failed to remove from collection')
    }
  }

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-(--bg-primary) text-(--text-primary)">
        <h2 className="text-xl font-semibold">Please log in to view your profile</h2>
        <Link to="/login" className="px-6 py-2.5 rounded-full bg-[#883bcf] text-white font-semibold no-underline">
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-10 bg-(--bg-primary) text-(--text-primary)">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* Profile Banner / Header Card */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-[0_12px_40px_rgba(136,59,207,0.15)] flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-[#883bcf] to-[#4c1d95] p-1 shadow-lg shadow-[#883bcf]/30 flex items-center justify-center overflow-hidden">
              {user?.avatar_url || avatarUrl ? (
                <img
                  src={user?.avatar_url || avatarUrl}
                  alt={user?.username}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <UserIcon size={48} className="text-white opacity-80" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold m-0 bg-linear-to-r from-white to-[#d9d0ff] bg-clip-text text-transparent">
                  {user?.username}
                </h1>
                <span className="text-xs text-(--text-secondary) flex items-center justify-center md:justify-start gap-1.5 mt-1">
                  <Calendar size={14} /> Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 justify-center md:justify-end">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-[#883bcf] hover:bg-[#7c2d12] text-xs font-semibold text-white cursor-pointer transition-all flex items-center gap-1.5 border-none"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-(--text-secondary) hover:text-white cursor-pointer transition-all border-none"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    logout()
                    navigate({ to: '/' })
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-400 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>

            {/* Profile Bio / Edit Form */}
            {isEditing ? (
              <div className="flex flex-col gap-3 mt-2 text-left bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] uppercase font-bold text-(--text-secondary)">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#883bcf]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] uppercase font-bold text-(--text-secondary)">Bio</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other trainers about yourself..."
                    className="bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#883bcf] resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] uppercase font-bold text-(--text-secondary)">Favorite Card</label>
                  <input
                    type="text"
                    value={favoriteCard}
                    onChange={(e) => setFavoriteCard(e.target.value)}
                    placeholder="Charizard ex, Pikachu Illustrator..."
                    className="bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#883bcf]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-(--text-secondary) m-0 leading-relaxed italic">
                  {user?.bio ? `"${user.bio}"` : 'No bio set yet. Click Edit Profile to add one!'}
                </p>
                {user?.favorite_card && (
                  <div className="flex items-center gap-1.5 text-xs text-[#d9d0ff]">
                    <Sparkles size={14} className="text-[#883bcf]" />
                    <span>Favorite Card: <b className="text-white">{user.favorite_card}</b></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Heart size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold">{profileData?.wishlist_count || 0}</span>
              <span className="text-xs text-(--text-secondary) uppercase tracking-wider font-semibold">Wishlisted Cards</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#883bcf]/15 border border-[#883bcf]/30 flex items-center justify-center text-[#883bcf] shrink-0">
              <Layers size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold">{profileData?.collection_count || 0}</span>
              <span className="text-xs text-(--text-secondary) uppercase tracking-wider font-semibold">Cards in Collection</span>
            </div>
          </div>
        </div>

        {/* Tabs for Wishlist & Collection */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`text-sm font-bold bg-transparent border-none cursor-pointer pb-2 transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'wishlist'
                  ? 'border-[#883bcf] text-white'
                  : 'border-transparent text-(--text-secondary) hover:text-white'
              }`}
            >
              <Heart size={16} /> Wishlist ({profileData?.wishlist_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`text-sm font-bold bg-transparent border-none cursor-pointer pb-2 transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'collection'
                  ? 'border-[#883bcf] text-white'
                  : 'border-transparent text-(--text-secondary) hover:text-white'
              }`}
            >
              <Layers size={16} /> Collection ({profileData?.collection_count || 0})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'wishlist' && (
            <div>
              {profileData?.wishlist && profileData.wishlist.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {profileData.wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:-translate-y-1 hover:border-[#883bcf]/50"
                    >
                      <Link to="/cards/$cardId" params={{ cardId: item.card_id }}>
                        <ImageWithSkeleton
                          src={`${item.card_image}/low.webp`}
                          alt={item.card_name}
                          loading="lazy"
                          aspectRatio="5/7"
                          containerClassName="w-full rounded-t-xl"
                          className="w-full rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>
                      <div className="p-3 flex items-center justify-between gap-2 bg-black/60 backdrop-blur-md">
                        <div className="truncate">
                          <span className="text-xs font-bold text-white truncate block">{item.card_name}</span>
                          <span className="text-[0.65rem] text-(--text-secondary) truncate block">{item.set_name || item.set_id}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveWishlist(item.card_id)}
                          title="Remove from wishlist"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 border-none cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <PackageOpen size={48} className="text-[#883bcf] opacity-40" />
                  <h3 className="text-lg font-semibold m-0 text-(--text-secondary)">Your wishlist is empty</h3>
                  <p className="text-xs text-(--text-secondary)/60 m-0">Browse cards and click the heart icon to save them here!</p>
                  <Link to="/cards" className="mt-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold no-underline">
                    Browse Cards
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collection' && (
            <div>
              {profileData?.collection && profileData.collection.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {profileData.collection.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:-translate-y-1 hover:border-[#883bcf]/50"
                    >
                      <Link to="/cards/$cardId" params={{ cardId: item.card_id }}>
                        <ImageWithSkeleton
                          src={`${item.card_image}/low.webp`}
                          alt={item.card_name}
                          loading="lazy"
                          aspectRatio="5/7"
                          containerClassName="w-full rounded-t-xl"
                          className="w-full rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>
                      <div className="p-3 flex items-center justify-between gap-2 bg-black/60 backdrop-blur-md">
                        <div className="truncate">
                          <span className="text-xs font-bold text-white truncate block">{item.card_name}</span>
                          <span className="text-[0.65rem] text-[#883bcf] font-bold block">Qty: {item.quantity}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveCollection(item.card_id)}
                          title="Remove from collection"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 border-none cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <PackageOpen size={48} className="text-[#883bcf] opacity-40" />
                  <h3 className="text-lg font-semibold m-0 text-(--text-secondary)">Your collection is empty</h3>
                  <p className="text-xs text-(--text-secondary)/60 m-0">Add cards you own to track your physical collection!</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
