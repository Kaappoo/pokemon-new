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
new/changed sets. Run it once manually after setting up the database to do
the initial import.

### Scheduled sync via GitHub Actions

`.github/workflows/sync-catalog.yml` runs the sync automatically every night
at 03:00 UTC (and can be triggered manually from the Actions tab). It's free
on GitHub Actions' minutes, unlike Render's Cron Jobs which require a paid
plan. To enable it:

1. In the GitHub repo, go to **Settings → Secrets and variables → Actions**.
2. Add a new repository secret named `DATABASE_URL` with the same Neon
   connection string used in `backend/.env`.

That's it - no other setup needed. The workflow builds the backend and runs
`./catalog-sync sync` against your Neon database, the same command you'd run
locally.

### Important: use Neon's *direct* connection string for the sync job

The sync job writes concurrently (several goroutines upserting sets/cards at
once). Neon's default connection string in the dashboard is the **pooled**
one (hostname ends in `-pooler`), which routes through PgBouncer in
transaction-pooling mode - that doesn't support the prepared-statement
protocol Go's Postgres driver uses, and under concurrent writes it fails with
errors like `bind message supplies N parameters, but prepared statement ""
requires M`. The sync job now detects a high failure rate and exits non-zero
instead of silently leaving the catalog half-populated, but the real fix is
to avoid the pooled endpoint for this job:

1. In the Neon dashboard's connection string widget, turn the **"Connection
   pooling"** toggle **off** (or just remove `-pooler` from the hostname in
   the string you already have).
2. Use that direct connection string as the `DATABASE_URL` secret for the
   GitHub Actions workflow specifically.

The web backend's own `DATABASE_URL` (`.env` / Render env var) can stay on
the pooled connection string if you like - it does one query at a time per
request, so it doesn't hit this issue. It's only the sync job's concurrent
writes that need the direct endpoint.
