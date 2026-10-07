# Glossary

Domain language for Poké Cards. Code, UI copy and issues should use these terms.

| Term | Meaning | In code |
| --- | --- | --- |
| **Serie** | TCGdex's grouping of sets into eras (Base, Scarlet & Violet, Mega Evolution…). Spelled "serie" in TCGdex and the schema; "series" in UI copy. | `series` table |
| **Set** | One expansion (Base Set, 151, …) with a release date, logo and card count. | `sets` table, `SetSummary` |
| **Card** | One printing in one set, identified by TCGdex's global id ("base1-4"). The same Pokémon in two sets is two cards. | `cards` table, `CardSummary` |
| **Local id / number** | The number printed on the card ("4", "TG05"). Shown as **printed number** "4/102" when the set's official count is known. | `localId`, `printedNumber` |
| **Official / total count** | Numbered cards in a set vs. all cards including secret rares. | `card_count_official`, `card_count_total` |
| **Pocket** | Pokémon TCG Pocket, the mobile game. Its sets live under TCGdex's `tcgp` serie and are hidden unless switched on. | `is_pocket`, `isPocketSerie` |
| **Physical TCG** | Everything that isn't Pocket: the printed card game. The default view. | `is_pocket = false` |
| **Sync** | The job that pulls every set and card from TCGdex into Postgres. Runs nightly. | `syncCatalog`, `pnpm sync` |
| **Enrich** | Fetching a card's full detail (attacks, HP, rarity, legality) and storing its raw payload. Cards are listed first, enriched after. | `raw_data`, `enrichPendingCards` in `sync.ts` |
| **Binder** | A collector's wishlist and collection together. | `BinderService` |
| **Collection** | Cards a collector owns, with a **copy count** (quantity) per card. | `collection_items` |
| **Wishlist** | Cards a collector is hunting. Adding a card to the collection removes it from the wishlist. | `wishlist_items` |
| **Set progress** | Distinct cards owned from a set / cards in the set. | `/sets/$setId` |
| **Collector** | A signed-in user, as seen on their public profile. | `/u/$username` |
| **Legacy account** | An account migrated from the original Go backend; its id starts with `legacy-` and its password is a bcrypt hash. | ADR 0004 |
