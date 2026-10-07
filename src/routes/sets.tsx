import { createFileRoute, Outlet } from '@tanstack/react-router'

/** Layout for /sets (the list) and /sets/$setId (one set). */
export const Route = createFileRoute('/sets')({
  component: Outlet,
})
