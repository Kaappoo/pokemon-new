-- Carries accounts, wishlists and collections over from the Go backend's
-- tables (users, wishlists, collections) into better-auth's tables and the new
-- binder tables. Does nothing on databases that never had the legacy tables.
--
-- * Password hashes are copied untouched. They are bcrypt; src/server/auth.ts
--   verifies bcrypt hashes, so everyone signs in with their old password.
-- * Legacy user N becomes user id "legacy-N".
-- * Rows that can't be carried over are skipped instead of failing the
--   migration: a username/email that clashes case-insensitively with another
--   account, or a wishlist/collection card that is no longer in the catalog.
-- * The legacy tables are left in place. Drop them once you've checked the data.
DO $$
BEGIN
	IF to_regclass('public.users') IS NULL THEN
		RETURN;
	END IF;

	INSERT INTO "user" (id, name, email, email_verified, image, username, display_username, bio, favorite_card, created_at, updated_at)
	SELECT
		'legacy-' || u.id,
		u.username,
		lower(u.email),
		false,
		NULLIF(u.avatar_url, ''),
		lower(u.username),
		u.username,
		NULLIF(u.bio, ''),
		NULLIF(u.favorite_card, ''),
		COALESCE(u.created_at, now()),
		COALESCE(u.created_at, now())
	FROM users u
	ORDER BY u.id
	ON CONFLICT DO NOTHING;

	INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
	SELECT
		'legacy-' || u.id,
		'legacy-' || u.id,
		'credential',
		'legacy-' || u.id,
		u.password_hash,
		COALESCE(u.created_at, now()),
		now()
	FROM users u
	JOIN "user" n ON n.id = 'legacy-' || u.id
	ON CONFLICT (id) DO NOTHING;

	IF to_regclass('public.wishlists') IS NOT NULL THEN
		INSERT INTO wishlist_items (user_id, card_id, created_at)
		SELECT 'legacy-' || w.user_id, w.card_id, COALESCE(w.created_at, now())
		FROM wishlists w
		JOIN "user" n ON n.id = 'legacy-' || w.user_id
		JOIN cards c ON c.id = w.card_id
		ON CONFLICT DO NOTHING;
	END IF;

	IF to_regclass('public.collections') IS NOT NULL THEN
		INSERT INTO collection_items (user_id, card_id, quantity, created_at, updated_at)
		SELECT 'legacy-' || c.user_id, c.card_id, GREATEST(c.quantity, 1), COALESCE(c.created_at, now()), now()
		FROM collections c
		JOIN "user" n ON n.id = 'legacy-' || c.user_id
		JOIN cards k ON k.id = c.card_id
		ON CONFLICT DO NOTHING;
	END IF;
END $$;
