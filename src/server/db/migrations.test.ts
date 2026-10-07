import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { describe, expect, it } from 'vitest'
import { MIGRATIONS_FOLDER } from './client.ts'

/** The tables the Go backend created on the production database, verbatim. */
const GO_SCHEMA = `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '', avatar_url TEXT DEFAULT '', favorite_card TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, card_id TEXT NOT NULL,
    card_name TEXT NOT NULL, card_image TEXT NOT NULL, set_id TEXT DEFAULT '', set_name TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, CONSTRAINT unique_user_wishlist_card UNIQUE(user_id, card_id));
  CREATE TABLE collections (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, card_id TEXT NOT NULL,
    card_name TEXT NOT NULL, card_image TEXT NOT NULL, set_id TEXT DEFAULT '', set_name TEXT DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1, rarity TEXT DEFAULT '', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_collection_card UNIQUE(user_id, card_id));
  CREATE TABLE series (id TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE sets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, logo TEXT DEFAULT '', symbol TEXT DEFAULT '',
    serie_id TEXT NOT NULL REFERENCES series(id), release_date TEXT DEFAULT '', card_count_total INTEGER DEFAULT 0,
    card_count_official INTEGER DEFAULT 0, is_pocket BOOLEAN NOT NULL DEFAULT FALSE, raw_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE cards (
    id TEXT PRIMARY KEY, local_id TEXT NOT NULL, name TEXT NOT NULL, image TEXT DEFAULT '',
    set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE, is_pocket BOOLEAN NOT NULL DEFAULT FALSE, category TEXT,
    rarity TEXT, hp INTEGER, types TEXT[], raw_data JSONB, details_synced_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX idx_sets_release_date ON sets(release_date DESC);
  CREATE INDEX idx_cards_pending_details ON cards(id) WHERE raw_data IS NULL;
`

// bcrypt hash of "pikachu1" (cost 10), as the Go backend stored it.
export const BCRYPT_PIKACHU1 = '$2b$10$R8R66O61yL6gORlxKNPbheqQdsgo64Gaj9.tVyhPG8IEreEylMMeK'

const freshDb = async () => {
  const client = new PGlite()
  return { client, db: drizzle({ client }) }
}

describe('migrations', () => {
  it('build the whole schema on an empty database', async () => {
    const { client, db } = await freshDb()
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    )
    expect(rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining(['account', 'cards', 'collection_items', 'series', 'session', 'sets', 'user', 'wishlist_items']),
    )
  })

  it("adopt the Go backend's tables and carry its accounts, wishlists and collections over", async () => {
    const { client, db } = await freshDb()
    await client.exec(GO_SCHEMA)
    await client.exec(`
      INSERT INTO series VALUES ('base', 'Base');
      INSERT INTO sets (id, name, serie_id, release_date) VALUES ('base1', 'Base Set', 'base', '1999-01-09');
      INSERT INTO cards (id, local_id, name, set_id) VALUES ('base1-4', '4', 'Charizard', 'base1'), ('base1-58', '58', 'Pikachu', 'base1');
      INSERT INTO users (username, email, password_hash, bio, avatar_url) VALUES
        ('Ash', 'Ash@Pallet.town', '${BCRYPT_PIKACHU1}', 'Gotta catch em all', ''),
        ('ash', 'other@pallet.town', '${BCRYPT_PIKACHU1}', '', '');
      INSERT INTO wishlists (user_id, card_id, card_name, card_image) VALUES (1, 'base1-4', 'Charizard', 'x'), (1, 'gone-1', 'Gone', 'x');
      INSERT INTO collections (user_id, card_id, card_name, card_image, quantity) VALUES (1, 'base1-58', 'Pikachu', 'x', 3);
    `)

    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })

    // Catalog data survives untouched.
    const cards = await client.query(`select id from cards order by id`)
    expect(cards.rows).toHaveLength(2)

    // The first "ash" is carried over; the case-insensitive duplicate is skipped, not fatal.
    const users = await client.query<{ id: string; email: string; username: string; display_username: string; bio: string }>(
      `select id, email, username, display_username, bio from "user"`,
    )
    expect(users.rows).toEqual([
      { id: 'legacy-1', email: 'ash@pallet.town', username: 'ash', display_username: 'Ash', bio: 'Gotta catch em all' },
    ])

    const accounts = await client.query<{ provider_id: string; password: string }>(
      `select provider_id, password from account where user_id = 'legacy-1'`,
    )
    expect(accounts.rows).toEqual([{ provider_id: 'credential', password: BCRYPT_PIKACHU1 }])

    // Wishlist entries for cards no longer in the catalog are dropped.
    const wishlist = await client.query(`select card_id from wishlist_items where user_id = 'legacy-1'`)
    expect(wishlist.rows).toEqual([{ card_id: 'base1-4' }])
    const collection = await client.query(`select card_id, quantity from collection_items where user_id = 'legacy-1'`)
    expect(collection.rows).toEqual([{ card_id: 'base1-58', quantity: 3 }])
  })
})
