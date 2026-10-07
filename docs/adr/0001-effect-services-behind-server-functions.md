# 1. Effect services behind TanStack Start server functions

**Status:** accepted

## Context

The original app was a React SPA talking to a separate Go API on Render. Two deploys, two languages, CORS and a cold-starting free-tier server between the phone and the data (the "Failed to fetch" login bug came from that seam). tcgRank solves the same shape of problem as one TanStack Start app.

## Decision

- One full-stack TanStack Start app on Vercel. The Go backend is retired.
- Business logic lives in Effect 4 services (`Context.Service` + `Layer`) under `src/server/*/service.ts`: `CatalogService`, `BinderService`, `ProfilesService`. They depend on `Db` and `Tcgdex`, and read the signed-in user from the optional `CurrentUser` service.
- Server functions are thin: validate input with the shared Zod schema, then `runServerEffect(Service.use(...))`.
- `runServerEffect` (`src/server/effect/run.ts`) provides `CurrentUser` from the better-auth session, runs on one `ManagedRuntime`, and maps tagged errors: `NotFound` → router `notFound()`, others → HTTP status + message.

## Consequences

- Same-origin requests: no CORS, no API URL env var, no second service to wake up.
- Services are tested with `@effect/vitest` against a real, migrated Postgres (PGlite) per test — no mocks of Drizzle.
