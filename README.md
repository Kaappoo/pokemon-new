# Poké Cards

Every physical Pokémon TCG set and card, a wishlist of what you're hunting, and a binder that tracks how close each set is to complete. Pokémon TCG Pocket is kept out unless you switch it on.

Card data: [TCGdex](https://tcgdex.dev), synced nightly into Postgres.

## Quick start

```bash
pnpm install
pnpm db:migrate     # local PGlite database in ./.pglite
pnpm db:seed        # demo sets + account ash / pallet-town-1
pnpm dev            # http://localhost:3000
```

Want the real catalog locally? `pnpm sync --enrich-limit=200` (the full sync takes a while).

## Stack

TanStack Start · Effect 4 · Drizzle on Neon Postgres (PGlite locally) · better-auth · Tailwind 4 + Base UI · Vitest · Playwright · Storybook. See `CLAUDE.md` for commands and layout, `DESIGN.md` for the visual system, `docs/adr/` for the decisions.

## Deploying (Vercel)

Environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DATABASE_URL_UNPOOLED` | Neon **direct** connection string (migrations) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` / `APP_URL` | The site's public URL, e.g. `https://poke-cards.vercel.app` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional: magic-link sign-in emails |

`pnpm vercel-build` applies migrations before building, which also moves accounts from the old Go backend over (ADR 0004).

The nightly catalog sync runs in GitHub Actions; it needs the repository secret `DATABASE_URL` set to the **direct** Neon URL.
