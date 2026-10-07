# 3. Neon Postgres in production, PGlite locally and in tests

**Status:** accepted

## Context

Production data already lives in Neon (free tier). tcgRank uses libSQL so that local dev and tests need no server; we want the same without leaving Postgres.

## Decision

- `DATABASE_URL` set → Drizzle over `@neondatabase/serverless` (pooled URL at runtime).
- `DATABASE_URL` empty → PGlite (Postgres compiled to WASM) in `./.pglite`; tests use an in-memory PGlite per test (`Db.layerTest`); e2e uses `./.pglite-e2e`.
- PGlite is imported dynamically so it never ships in the production bundle.
- One set of drizzle-kit migrations serves both.

## Consequences

- Same SQL dialect everywhere; no Docker needed to develop or test.
- `pnpm db:seed` refuses to run against a real database unless `--force`.
