import { Link, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
// import { getNewestSet } from '@/lib/api'

export default function Header() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const goToNewReleases = useCallback(async () => {
    // try {
    //   const res = await getNewestSet()
    //   const setId = res.data[0]?.id
    //   if (setId) {
    //     navigate({ to: '/cards', search: { set: setId } })
    //   }
    // } catch (err) {
    //   console.error('Failed to get newest set:', err)
    // }
    setMobileOpen(false)
  }, [navigate])

  return (
    <header
      style={{ backgroundColor: 'var(--bg-header)' }}
      className="h-[10vh] min-h-[60px] flex items-center px-4 md:px-8 justify-between z-40 relative"
    >
      {/* Logo */}
      <Link to="/" className="text-white no-underline">
        <h1 className="text-xl md:text-2xl font-bold m-0 tracking-wide">
          Poké Cards
        </h1>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-0">
        <Link
          to="/cards"
          className="text-white text-lg font-medium px-3 hover:opacity-80 transition-opacity no-underline"
        >
          all cards
        </Link>
        <span className="border-l border-r border-white" />
        <button
          onClick={goToNewReleases}
          className="text-white text-lg font-medium px-3 hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer font-[Raleway]"
        >
          new releases
        </button>
        <span className="border-l border-r border-white" />
        <Link
          to="/sets"
          className="text-white text-lg font-medium px-3 hover:opacity-80 transition-opacity no-underline"
        >
          sets
        </Link>
      </nav>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-white bg-transparent border-none cursor-pointer p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          className="absolute top-full left-0 w-full flex flex-col items-center py-4 gap-4 z-50 md:hidden"
          style={{ backgroundColor: 'var(--bg-header)' }}
        >
          <Link
            to="/cards"
            onClick={() => setMobileOpen(false)}
            className="text-white text-lg font-medium no-underline hover:opacity-80"
          >
            all cards
          </Link>
          <button
            onClick={goToNewReleases}
            className="text-white text-lg font-medium bg-transparent border-none cursor-pointer font-[Raleway] hover:opacity-80"
          >
            new releases
          </button>
          <Link
            to="/sets"
            onClick={() => setMobileOpen(false)}
            className="text-white text-lg font-medium no-underline hover:opacity-80"
          >
            sets
          </Link>
        </nav>
      )}
    </header>
  )
}
