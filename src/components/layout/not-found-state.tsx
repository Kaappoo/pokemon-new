import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button.tsx'
import { Page } from './page.tsx'

export function NotFoundState() {
  return (
    <Page className="flex min-h-[60vh] flex-col items-start justify-center gap-6">
      <p className="font-numerals text-8xl text-orange">404</p>
      <h1 className="font-display text-4xl sm:text-5xl">This page isn&apos;t in the binder.</h1>
      <p className="max-w-lg text-paper-dim">The card, set or collector you were looking for doesn&apos;t exist.</p>
      <Link to="/cards" className={buttonVariants({ size: 'lg' })}>
        Search every card
      </Link>
    </Page>
  )
}
