# Neon Database Setup Instructions for Poké Cards

This project uses **Neon PostgreSQL** for storing user accounts, profile details, wishlists, and card collections.

---

## Step-by-Step Instructions to Finish Setup in Neon

### 1. Log in to your Neon Dashboard
Go to [https://console.neon.tech](https://console.neon.tech) and log in to your account.

### 2. Select or Create your Project
- If you already have a project for this app, select it.
- If you want a new project, click **"New Project"**, name it (e.g., `pokemon-cards`), and select PostgreSQL version 15 or 16.

### 3. Copy your Connection String
1. On the Project Overview page, locate the **"Connection Details"** widget.
2. Select **"Node.js"** or **"Go"** / **"PostgreSQL"** from the drop-down (or select `psql`).
3. Ensure the password checkbox is checked so the full password appears in the URL.
4. Copy the connection string. It will look like this:
   ```text
   postgres://alex_owner:npg_xY9Zabc123@ep-cool-dawn-a5xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Create your `.env` File
In the `backend` folder, create a file named `.env` and paste your connection string:

```env
DATABASE_URL=postgres://alex_owner:npg_xY9Zabc123@ep-cool-dawn-a5xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=8080
JWT_SECRET=poke-cards-super-secret-jwt-key-2026
```

### 5. Start the Backend
Open a terminal in the `backend` directory and run:

```bash
# On Windows PowerShell:
$env:DATABASE_URL="postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
go run .
```
Or set the environment variable in your terminal before launching `go run .`.

---

## Automatic Database Migration
When the Go backend starts up with a valid `DATABASE_URL`, it automatically creates the following tables if they do not exist:
- `users` (accounts, hashed passwords, profile info)
- `wishlists` (saved cards per user)
- `collections` (user card collection quantities)
- `series` / `sets` / `cards` (the card catalog, see below)

No manual SQL execution is required!

---

## Card Catalog Sync

Card and set data (`series`, `sets`, `cards` tables) is **not** fetched live
from the frontend anymore. Instead, the Go backend syncs it from
[TCGdex](https://tcgdex.dev) into Postgres, and serves it from
`/api/sets` and `/api/cards`. This is what lets the app:
- filter out Pokémon TCG Pocket sets/cards by default (`is_pocket` column,
  derived from TCGdex's `tcgp` serie) instead of mixing them in with the
  physical TCG, and
- keep serving cards even if TCGdex is briefly unreachable, and gives a
  place to patch any specific card found missing.

Run the sync manually (or wire it into a cron job / scheduled CI run) with:

```bash
cd backend
go run . sync
```

This is safe to re-run: it upserts every set, then only fetches full detail
(rarity, category, hp, types) for cards it hasn't enriched yet, so a first
run takes a few minutes but later runs are fast and only do work for
new/changed sets. Run it once after setting up the database, then on a
schedule (e.g. nightly) to pick up new sets/cards.
