# 4. Adopting the Go backend's data and passwords

**Status:** accepted

## Context

The production database was created by the Go backend: `series`/`sets`/`cards` plus `users`, `wishlists` and `collections`, with bcrypt password hashes. Existing users must keep their accounts, binders and passwords.

## Decision

- The catalog tables keep their Go names and columns; `0000_init.sql` is idempotent (`IF NOT EXISTS`, duplicate constraints ignored) so it adopts them in place.
- `0001_adopt_legacy_accounts.sql` copies `users` into better-auth's `user` + `account` (ids prefixed `legacy-`, emails and usernames lowercased) and `wishlists`/`collections` into `wishlist_items`/`collection_items`. It does nothing on a fresh database.
- `src/server/password.ts` verifies bcrypt hashes (`$2…`) for legacy accounts and scrypt for new ones. A legacy password keeps working as is.
- The legacy tables are left untouched as a backup.

## Consequences

- Existing users sign in with the same email/username and password.
- Avatar uploads (UploadThing) were not ported: the profile image is now a URL.
- Once production is confirmed healthy, `users`, `wishlists` and `collections` can be dropped by hand.
