# Product

**Poké Cards** is a reference and binder for the physical Pokémon Trading Card Game: every set and card, a wishlist of what you're hunting, and a collection that shows how close each set is to complete.

## Who it serves

- **Collectors** checking a card at a shop, a trade night or a card show: what is it, which set, what number, do I already have it?
- **Players** looking up attacks, legality and regulation marks.
- Brazilian and international collectors alike: data comes from TCGdex, the open, community-maintained card database.

## Use scene

Phone in one hand, a binder or a booster in the other, often at a busy shop with patchy signal. Sessions are short: search, glance, tap +, put the phone away. At home, longer sessions browsing a set and filling in the binder.

## Principles

- **The physical TCG, not the mobile game.** Pokémon TCG Pocket cards are a different product. They're hidden everywhere unless you explicitly switch them on.
- **One tap to log a card.** The + on the card page is the primary action; owning a card removes it from your wishlist.
- **Every card, even before its art.** New sets are listed before TCGdex has all their images. Those cards still appear, with a clean placeholder instead of a broken picture.
- **Works offline-ish.** Sets, cards you've opened, your wishlist and binder survive a dropped connection.

## Surfaces

| Surface | Mode | Route |
| --- | --- | --- |
| Landing | Persuade | `/` |
| Card search | Operate | `/cards` |
| Card | Read + operate | `/cards/$cardId` |
| Sets / set | Read | `/sets`, `/sets/$setId` |
| Wishlist, binder | Operate | `/wishlist`, `/collection` |
| Collector profile | Read | `/u/$username` |
| Settings, sign-in | Operate | `/settings`, `/sign-in`, `/sign-up` |
