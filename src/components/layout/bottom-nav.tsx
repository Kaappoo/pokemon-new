import { Link, useRouteContext } from '@tanstack/react-router'
import { BookOpen, Heart, Layers, Search, User } from 'lucide-react'

const tab =
  'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold text-paper-dim transition-colors data-[status=active]:text-orange [&_svg]:size-5'

/** Thumb-reach navigation for phones. The centre action is finding a card. */
export function BottomNav() {
  const { user } = useRouteContext({ from: '__root__' })

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        <Link to="/sets" className={tab}>
          <Layers />
          Sets
        </Link>
        <Link to="/wishlist" className={tab}>
          <Heart />
          Wishlist
        </Link>
        <Link
          to="/cards"
          className="-mt-5 flex flex-1 flex-col items-center gap-1 pb-2 text-[11px] font-semibold text-paper"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-orange text-on-orange shadow-[0_8px_18px_-8px_rgb(0_0_0/0.9)] transition-transform active:scale-95">
            <Search className="size-6" />
          </span>
          Search
        </Link>
        <Link to="/collection" className={tab}>
          <BookOpen />
          Binder
        </Link>
        {user?.username ? (
          <Link to="/u/$username" params={{ username: user.username }} className={tab}>
            <User />
            Profile
          </Link>
        ) : (
          <Link to="/sign-in" className={tab}>
            <User />
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
