# 2. A synced catalog instead of live TCGdex calls

**Status:** accepted

## Context

TCGdex's API can't filter Pokémon TCG Pocket out of sets or search results, and querying it live from the browser made every page depend on a third-party server. Some new cards are listed before they have images.

## Decision

- `pnpm sync` (`src/server/catalog/sync.ts`) copies every serie, set and card into Postgres, flags Pocket sets (`serie = 'tcgp'` → `is_pocket`) and then **enriches** cards one by one (full payload into `raw_data`).
- It runs nightly from GitHub Actions (`.github/workflows/sync-catalog.yml`), free on Actions minutes. The first run backfills ~20k cards and takes a while; later runs only enrich new or changed cards.
- The sync fails (non-zero exit, red workflow) when more than 5% of enrichments fail, so a TCGdex outage doesn't silently leave holes.
- A card opened before it's enriched is fetched live once and the result is stored.

## Consequences

- Search, filtering and the Pocket switch are plain SQL.
- The catalog is at most a day behind TCGdex.
- The sync and migrations need the **direct** (unpooled) Neon URL: PgBouncer in transaction mode breaks the concurrent prepared statements the sync uses.
