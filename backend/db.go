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
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			return fmt.Errorf("error executing migration query (%s): %w", query, err)
		}
	}

	return nil
}
