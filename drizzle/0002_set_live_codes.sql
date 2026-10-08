ALTER TABLE "sets" ADD COLUMN "live_code" text;--> statement-breakpoint
CREATE INDEX "idx_sets_live_code" ON "sets" USING btree ("live_code");--> statement-breakpoint
-- Backfill from the TCGdex payload already stored, so lookups work before the next sync (same rule as liveSetCode).
UPDATE "sets" SET "live_code" = nullif(upper(trim(coalesce(nullif(raw_data->>'tcgOnline', ''), raw_data->'abbreviation'->>'official', ''))), '') WHERE "raw_data" IS NOT NULL;
