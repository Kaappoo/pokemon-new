# Poké Cards

Pokémon TCG card browser: every physical-TCG set and card (Pokémon TCG Pocket kept separate), a wishlist and a collection binder with set progress. Read `PRODUCT.md` (what/who), `DESIGN.md` (visual system) and `GLOSSARY.md` (domain terms) before larger changes. The architecture and design system are shared with tcgRank (github.com/Kaappoo/tcgRank).

## Stack

TanStack Start (Router, Query + persist-client, Virtual, Pacer, Devtools) · TanStack Charts · Effect 4 · TypeScript 7 · Drizzle + Neon Postgres (PGlite locally and in tests) · better-auth (+ username, magic link) · Resend · satori + sharp (OG images) · Zod 4 + Effect Schema · Serwist · Tailwind 4 + shadcn on Base UI · Storybook 10 · Vitest 5 + @effect/vitest · jsdom + Testing Library + MSW · Playwright.

Card data comes from TCGdex (https://tcgdex.dev), synced into Postgres by `pnpm sync` — never fetched live from the browser.

## Commands

```bash
pnpm dev                 # http://localhost:3000 (first: pnpm db:migrate && pnpm db:seed)
pnpm typecheck           # tsc (TypeScript 7)
pnpm test                # vitest: server (node, @effect/vitest, PGlite) + client (jsdom, MSW)
pnpm test:e2e            # playwright (own dev server on :3100 with a seeded .pglite-e2e)
pnpm build               # vite build → .output (Nitro) + Serwist service worker
pnpm storybook           # component workbench on :6006
pnpm db:generate         # drizzle-kit migration from src/server/db/schema.ts
pnpm db:migrate          # apply migrations (Neon if DATABASE_URL is set, else ./.pglite)
pnpm db:seed             # demo catalog + demo account (ash / pallet-town-1); refuses real databases
pnpm sync                # pull the real catalog from TCGdex (--enrich-limit=N for a quick one)
pnpm review              # fallow + react-doctor + impeccable detect
```

## Layout

- `src/domain/` — pure rules: catalog (Pocket detection, printed-number order, image URLs), TCGdex payload schemas, binder maths, ids. No IO. Unit-tested.
- `src/server/` — Effect services (`catalog/`, `binder/`, `profiles/`), the catalog sync (`catalog/sync.ts`), the TCGdex client (`tcgdex/`), `db/`, `auth.ts`, `email/`, `og/`, `functions/` (thin `createServerFn` wrappers), `effect/run.ts` (Effect → server fn bridge).
- `src/shared/schemas.ts` — Zod schemas shared by forms, URL search params and server-function validators.
- `src/routes/` — file routes (TanStack Router). API routes under `routes/api/`.
- `src/components/ui/` — shadcn-style primitives on Base UI. Feature components in `components/{cards,sets,profile,layout,auth}`.
- `drizzle/` migrations, `scripts/` (migrate, seed, sync), `e2e/` Playwright, `tests/` client test setup, `docs/adr/` decisions.

## Conventions

- Business logic goes in an Effect service method (`Effect.fn('Service.method')`), never in a server function or component. Fail with tagged errors from `src/server/errors.ts`.
- Time via `Clock` in Effect code; tests rely on it.
- Server tests use `withDb(Service.layer)`, `asUser(user)`, `seedCatalog()` and `tcgdexTest()` from `src/server/testing.ts` against a real migrated in-memory Postgres (PGlite). No mocks of Drizzle.
- Anything rendered on the server and the client must hydrate identically: `<LocalTime>` for instants, `<ReleaseDate>` for set dates, `useHydrated()` for browser-only branches. Submit buttons use `<SubmitButton>`.
- Card images always go through `<CardArt>`: it handles missing and failed art.
- Colours only through tokens (`bg-orange`, `text-paper-dim`, …). No new accent colours; see DESIGN.md "Refused".
- Migrations must stay safe on the production database, which still holds the Go backend's tables (see ADR 0004).
- Run `pnpm typecheck && pnpm test` before committing; run `pnpm review` for UI work.

## Agent skills

### Git workflow

Branches are `<type>/<kebab-description>` off `master` (e.g. `fix/migrate-on-vercel-deploy`), commits and PR titles follow Conventional Commits, PRs are squash-merged. Never use generated branch names (`ccr-…`, `claude/…`). See `docs/agents/git-workflow.md`.

### Issue tracker

Issues live in GitHub Issues for this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Installed skills

- `.claude/skills/` — Matt Pocock's engineering skills (`tdd`, `to-spec`, `to-tickets`, `implement`, `code-review`, `diagnosing-bugs`, `improve-codebase-architecture`, `grill-me`, …) and **impeccable** (design: `/impeccable critique|audit|polish|animate …`).
