import { Link, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Menu, X, Heart, User as UserIcon, LogIn } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

export default function Header() {
  const navigate = useNavigate()
  const { user, wishlist } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const goToNewReleases = useCallback(async () => {
    setMobileOpen(false)
  }, [navigate])

  return (
    <header className="h-[10vh] min-h-[60px] flex items-center px-4 md:px-8 justify-between z-40 relative bg-(--bg-header)/90 backdrop-blur-md border-b border-white/[0.06]">
      {/* Logo */}
      <Link to="/" className="text-white no-underline group flex items-center gap-2">
        <h1 className="text-xl md:text-2xl font-extrabold m-0 tracking-tight bg-linear-to-r from-white to-[#d9d0ff] bg-clip-text text-transparent group-hover:from-[#d9d0ff] group-hover:to-white transition-all duration-300">
          Poké Cards
        </h1>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-1">
        <NavLink to="/cards">all cards</NavLink>
        <span className="w-px h-4 bg-white/20" />
        <button
          onClick={goToNewReleases}
          className="text-(--text-secondary) text-sm font-medium px-4 py-2 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all duration-200 bg-transparent border-none cursor-pointer font-[Raleway] uppercase tracking-wider"
        >
          new releases
        </button>
        <span className="w-px h-4 bg-white/20" />
        <NavLink to="/sets">sets</NavLink>
        <span className="w-px h-4 bg-white/20" />
        <Link
          to="/wishlist"
          className="text-(--text-secondary) text-sm font-medium px-4 py-2 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all duration-200 no-underline uppercase tracking-wider flex items-center gap-1.5"
        >
          <Heart size={16} className="text-red-400" />
          <span>wishlist</span>
          {wishlist.length > 0 && (
            <span className="bg-[#883bcf] text-white text-[0.65rem] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {wishlist.length}
            </span>
          )}
        </Link>
      </nav>

      {/* Auth / Profile Area */}
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#883bcf]/50 hover:bg-white/10 text-white text-xs font-bold no-underline transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-[#883bcf] flex items-center justify-center text-white overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <span className="truncate max-w-[100px]">{user.username}</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-linear-to-r from-[#883bcf] to-[#a855f7] text-white text-xs font-bold no-underline shadow-md shadow-[#883bcf]/20 hover:opacity-90 transition-opacity"
          >
            <LogIn size={14} /> Sign In
          </Link>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-white bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="absolute top-full left-0 w-full flex flex-col items-center py-6 gap-4 z-50 md:hidden bg-(--bg-header)/95 backdrop-blur-lg border-b border-white/[0.08]">
          <Link
            to="/cards"
            onClick={() => setMobileOpen(false)}
            className="text-(--text-secondary) text-base font-medium no-underline hover:text-white transition-colors uppercase tracking-wider"
          >
            all cards
          </Link>
          <div className="w-16 h-px bg-white/10" />
          <button
            onClick={goToNewReleases}
            className="text-(--text-secondary) text-base font-medium bg-transparent border-none cursor-pointer font-[Raleway] hover:text-white transition-colors uppercase tracking-wider"
          >
            new releases
          </button>
          <div className="w-16 h-px bg-white/10" />
          <Link
            to="/sets"
            onClick={() => setMobileOpen(false)}
            className="text-(--text-secondary) text-base font-medium no-underline hover:text-white transition-colors uppercase tracking-wider"
          >
            sets
          </Link>
          <div className="w-16 h-px bg-white/10" />
          <Link
            to="/wishlist"
            onClick={() => setMobileOpen(false)}
            className="text-(--text-secondary) text-base font-medium no-underline hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2"
          >
            <Heart size={18} className="text-red-400" /> wishlist ({wishlist.length})
          </Link>
          <div className="w-16 h-px bg-white/10" />
          {user ? (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="text-white text-base font-bold no-underline px-6 py-2 rounded-full bg-[#883bcf] flex items-center gap-2"
            >
              <UserIcon size={18} /> {user.username}'s Profile
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="text-white text-base font-bold no-underline px-6 py-2 rounded-full bg-linear-to-r from-[#883bcf] to-[#a855f7] flex items-center gap-2"
            >
              <LogIn size={18} /> Sign In
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-(--text-secondary) text-sm font-medium px-4 py-2 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all duration-200 no-underline uppercase tracking-wider"
    >
      {children}
    </Link>
  )
}
