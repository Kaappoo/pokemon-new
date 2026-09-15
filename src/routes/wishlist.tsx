import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { Heart, Trash2, PackageOpen, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/wishlist')({
  component: WishlistPage,
})

function WishlistPage() {
  const { user, wishlist, toggleWishlist, isLoading } = useAuth()

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-(--bg-primary) text-(--text-primary) p-4 text-center">
        <Heart size={48} className="text-[#883bcf] opacity-50" />
        <h2 className="text-xl font-bold m-0">Log in to view your Wishlist</h2>
        <p className="text-sm text-(--text-secondary) max-w-sm m-0">
          Save your favorite Pokémon cards to your wishlist and access them anytime across devices.
        </p>
        <Link to="/login" className="mt-2 px-6 py-2.5 rounded-full bg-[#883bcf] text-white font-semibold no-underline shadow-lg shadow-[#883bcf]/30">
          Log In / Register
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-10 bg-(--bg-primary) text-(--text-primary)">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Heart size={20} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold m-0 bg-linear-to-r from-white to-[#d9d0ff] bg-clip-text text-transparent">
                My Wishlist
              </h1>
              <span className="text-xs text-(--text-secondary)">
                {wishlist.length} {wishlist.length === 1 ? 'card' : 'cards'} saved
              </span>
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlist.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#883bcf]/60 hover:shadow-[0_12px_30px_rgba(136,59,207,0.2)] flex flex-col"
              >
                <Link to="/cards/$cardId" params={{ cardId: item.card_id }} className="block overflow-hidden">
                  <img
                    src={`${item.card_image}/low.webp`}
                    alt={item.card_name}
                    loading="lazy"
                    className="w-full rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="p-3 flex items-center justify-between gap-2 bg-black/60 backdrop-blur-md border-t border-white/5 mt-auto">
                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">{item.card_name}</span>
                    {item.set_name && (
                      <span className="text-[0.65rem] text-(--text-secondary) truncate block">{item.set_name}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleWishlist({ card_id: item.card_id, card_name: item.card_name, card_image: item.card_image })}
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
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <PackageOpen size={56} className="text-[#883bcf] opacity-40 animate-pulse" />
            <h2 className="text-xl font-bold m-0 text-(--text-secondary)">Your wishlist is empty</h2>
            <p className="text-sm text-(--text-secondary)/60 max-w-sm m-0">
              Explore the card database and click the heart icon on any card to add it to your wishlist!
            </p>
            <Link
              to="/cards"
              className="mt-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#883bcf] to-[#a855f7] text-white text-xs font-bold no-underline shadow-lg shadow-[#883bcf]/30 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Sparkles size={16} /> Explore All Cards
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
