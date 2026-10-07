import { createFileRoute, redirect } from '@tanstack/react-router'

/** The old app's sign-in URL. Kept so bookmarks and shared links still land somewhere useful. */
export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    throw redirect({ to: '/sign-in', replace: true })
  },
})
