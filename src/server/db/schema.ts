import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

/* ------------------------------------------------------------------ */
/* Catalog — synced from TCGdex by scripts/sync-catalog.ts.            */
/* Column, index and constraint names match the tables the original    */
/* Go backend created, so production data is adopted, not recreated.   */
/* ------------------------------------------------------------------ */

export const series = pgTable('series', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const sets = pgTable(
  'sets',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    logo: text('logo').default(''),
    symbol: text('symbol').default(''),
    serieId: text('serie_id').notNull(),
    /** ISO date (YYYY-MM-DD) as published by TCGdex; sorts lexically. */
    releaseDate: text('release_date').default(''),
    cardCountTotal: integer('card_count_total').default(0),
    cardCountOfficial: integer('card_count_official').default(0),
    /** True for Pokémon TCG Pocket (the mobile game), which is not the physical TCG. */
    isPocket: boolean('is_pocket').notNull().default(false),
    /** The complete TCGdex set payload captured at sync time. */
    rawData: jsonb('raw_data'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'sets_serie_id_fkey', columns: [t.serieId], foreignColumns: [series.id] }),
    index('idx_sets_pocket').on(t.isPocket),
    index('idx_sets_release_date').on(t.releaseDate.desc()),
  ],
)

export const cards = pgTable(
  'cards',
  {
    /** Global TCGdex id, e.g. "base1-4". */
    id: text('id').primaryKey(),
    /** Number printed on the card, e.g. "4" or "TG05". */
    localId: text('local_id').notNull(),
    name: text('name').notNull(),
    /** TCGdex image base URL; append "/high.webp" or "/low.webp". Empty until art is published. */
    image: text('image').default(''),
    setId: text('set_id').notNull(),
    isPocket: boolean('is_pocket').notNull().default(false),
    category: text('category'),
    rarity: text('rarity'),
    hp: integer('hp'),
    types: text('types').array(),
    /** The complete TCGdex card payload. Null until the card has been enriched. */
    rawData: jsonb('raw_data'),
    detailsSyncedAt: timestamp('details_synced_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'cards_set_id_fkey', columns: [t.setId], foreignColumns: [sets.id] }).onDelete('cascade'),
    index('idx_cards_set').on(t.setId),
    index('idx_cards_pocket').on(t.isPocket),
    index('idx_cards_category').on(t.category),
    index('idx_cards_name').on(t.name),
    index('idx_cards_pending_details').on(t.id).where(sql`raw_data IS NULL`),
  ],
)

/* ------------------------------------------------------------------ */
/* better-auth                                                         */
/* ------------------------------------------------------------------ */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  bio: text('bio'),
  favoriteCard: text('favorite_card'),
  ...timestamps,
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index('session_user_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (t) => [index('account_user_idx').on(t.userId)],
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
})

/* ------------------------------------------------------------------ */
/* Binder — what each collector wants and owns                         */
/* ------------------------------------------------------------------ */

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'wishlist_items_pk', columns: [t.userId, t.cardId] })],
)

export const collectionItems = pgTable(
  'collection_items',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    ...timestamps,
  },
  (t) => [
    primaryKey({ name: 'collection_items_pk', columns: [t.userId, t.cardId] }),
    check('collection_items_quantity_positive', sql`${t.quantity} > 0`),
  ],
)

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const seriesRelations = relations(series, ({ many }) => ({ sets: many(sets) }))

export const setRelations = relations(sets, ({ one, many }) => ({
  serie: one(series, { fields: [sets.serieId], references: [series.id] }),
  cards: many(cards),
}))

export const cardRelations = relations(cards, ({ one }) => ({
  set: one(sets, { fields: [cards.setId], references: [sets.id] }),
}))

export const userRelations = relations(user, ({ many }) => ({
  wishlist: many(wishlistItems),
  collection: many(collectionItems),
}))

export const wishlistRelations = relations(wishlistItems, ({ one }) => ({
  user: one(user, { fields: [wishlistItems.userId], references: [user.id] }),
  card: one(cards, { fields: [wishlistItems.cardId], references: [cards.id] }),
}))

export const collectionRelations = relations(collectionItems, ({ one }) => ({
  user: one(user, { fields: [collectionItems.userId], references: [user.id] }),
  card: one(cards, { fields: [collectionItems.cardId], references: [cards.id] }),
}))

export type UserRow = typeof user.$inferSelect
export type SetRow = typeof sets.$inferSelect
export type CardRow = typeof cards.$inferSelect
