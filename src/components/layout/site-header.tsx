import { Link, useRouteContext } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { buttonVariants } from '#/components/ui/button.tsx'
import { cn } from '#/lib/utils.ts'
import { Logo } from './logo.tsx'
import { UserMenu } from './user-menu.tsx'

const navLink =
  'relative py-2 text-sm font-semibold text-paper-dim transition-colors hover:text-paper data-[status=active]:text-paper after:absolute after:inset-x-0 after:-bottom-[17px] after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-orange after:transition-transform after:duration-300 after:ease-out-expo data-[status=active]:after:scale-x-100'

export function SiteHeader() {
  const { user } = useRouteContext({ from: '__root__' })

  return (
    <header
      style={{ viewTransitionName: 'site-header' }}
      className="sticky top-0 z-40 border-b border-line/80 bg-ink/80 backdrop-blur-md supports-[backdrop-filter]:bg-ink/65"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" aria-label="Poké Cards home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <Link to="/cards" className={navLink}>
            Cards
          </Link>
          <Link to="/sets" className={navLink}>
            Sets
          </Link>
          {user ? (
            <>
              <Link to="/wishlist" className={navLink}>
                Wishlist
              </Link>
              <Link to="/collection" className={navLink}>
                Collection
              </Link>
            </>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/cards"
            aria-label="Search cards"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'hidden md:inline-flex')}
          >
            <Search />
          </Link>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link to="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link to="/sign-up" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
