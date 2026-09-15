package main

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB(connStr string) (*sql.DB, error) {
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Neon's free tier pools a limited number of connections; keep well under
	// that even when the catalog sync job fans out concurrent requests.
	db.SetMaxOpenConns(10)

	if err = createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return db, nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			bio TEXT DEFAULT '',
			avatar_url TEXT DEFAULT '',
			favorite_card TEXT DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS wishlists (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			card_id TEXT NOT NULL,
			card_name TEXT NOT NULL,
			card_image TEXT NOT NULL,
			set_id TEXT DEFAULT '',
			set_name TEXT DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT unique_user_wishlist_card UNIQUE(user_id, card_id)
		);`,
		`CREATE TABLE IF NOT EXISTS collections (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			card_id TEXT NOT NULL,
			card_name TEXT NOT NULL,
			card_image TEXT NOT NULL,
			set_id TEXT DEFAULT '',
			set_name TEXT DEFAULT '',
			quantity INTEGER NOT NULL DEFAULT 1,
			rarity TEXT DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT unique_user_collection_card UNIQUE(user_id, card_id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_wishlists_card ON wishlists(card_id);`,
		`CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_collections_card ON collections(card_id);`,

		// ── Card catalog (synced from TCGdex, see catalog_sync.go) ──────────
		`CREATE TABLE IF NOT EXISTS series (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS sets (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			logo TEXT DEFAULT '',
			symbol TEXT DEFAULT '',
			serie_id TEXT NOT NULL REFERENCES series(id),
			release_date TEXT DEFAULT '',
			card_count_total INTEGER DEFAULT 0,
			card_count_official INTEGER DEFAULT 0,
			is_pocket BOOLEAN NOT NULL DEFAULT FALSE,
			raw_data JSONB,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS cards (
			id TEXT PRIMARY KEY,
			local_id TEXT NOT NULL,
			name TEXT NOT NULL,
			image TEXT DEFAULT '',
			set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
			is_pocket BOOLEAN NOT NULL DEFAULT FALSE,
			category TEXT,
			rarity TEXT,
			hp INTEGER,
			types TEXT[],
			raw_data JSONB,
			details_synced_at TIMESTAMP WITH TIME ZONE,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE INDEX IF NOT EXISTS idx_sets_pocket ON sets(is_pocket);`,
		`CREATE INDEX IF NOT EXISTS idx_sets_release_date ON sets(release_date DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_id);`,
		`CREATE INDEX IF NOT EXISTS idx_cards_pocket ON cards(is_pocket);`,
		`CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(category);`,
		`CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);`,
		`CREATE INDEX IF NOT EXISTS idx_cards_pending_details ON cards(id) WHERE raw_data IS NULL;`,
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			return fmt.Errorf("error executing migration query (%s): %w", query, err)
		}
	}

	return nil
}
