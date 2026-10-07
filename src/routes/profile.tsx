import { createFileRoute, redirect } from '@tanstack/react-router'

/** The old app's profile URL: your public profile when signed in, otherwise sign-in. */
export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    if (context.user?.username) throw redirect({ to: '/u/$username', params: { username: context.user.username } })
    throw redirect({ to: '/sign-in', search: { redirect: '/profile' } })
  },
})
