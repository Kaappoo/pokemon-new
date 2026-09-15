package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/lib/pq"
)

const syncConcurrency = 8

// SyncCatalog pulls every set (physical TCG + TCG Pocket) from TCGdex,
// upserts series/sets/cards, and enriches any card that doesn't have full
// detail yet (rarity/category/hp/types). Safe to run repeatedly - already
// enriched cards are left untouched, so a nightly re-run only does work for
// new or changed sets/cards.
func SyncCatalog(db *sql.DB) error {
	log.Println("📡 Fetching set list from TCGdex...")
	resumes, err := fetchAllSetResumes()
	if err != nil {
		return fmt.Errorf("listing sets: %w", err)
	}
	log.Printf("   found %d sets\n", len(resumes))

	var (
		mu          sync.Mutex
		setErrs     []string
		syncedSets  int
		syncedCards int
		totalOps    int // every series/set/card upsert attempted, success or fail
	)

	sem := make(chan struct{}, syncConcurrency)
	var wg sync.WaitGroup

	for _, resume := range resumes {
		wg.Add(1)
		sem <- struct{}{}
		go func(setID string) {
			defer wg.Done()
			defer func() { <-sem }()

			set, raw, err := fetchSet(setID)
			if err != nil {
				mu.Lock()
				setErrs = append(setErrs, fmt.Sprintf("%s: %v", setID, err))
				mu.Unlock()
				return
			}

			isPocket := set.Serie.ID == tcgdexPocketSerieID

			mu.Lock()
			totalOps++
			mu.Unlock()
			if err := upsertSeries(db, set.Serie.ID, set.Serie.Name); err != nil {
				mu.Lock()
				setErrs = append(setErrs, fmt.Sprintf("series for %s: %v", setID, err))
				mu.Unlock()
				return
			}

			mu.Lock()
			totalOps++
			mu.Unlock()
			if err := upsertSet(db, set, raw, isPocket); err != nil {
				mu.Lock()
				setErrs = append(setErrs, fmt.Sprintf("upsert set %s: %v", setID, err))
				mu.Unlock()
				return
			}

			cardCount := 0
			for _, c := range set.Cards {
				mu.Lock()
				totalOps++
				mu.Unlock()
				if err := upsertCardResume(db, c, setID, isPocket); err != nil {
					mu.Lock()
					setErrs = append(setErrs, fmt.Sprintf("upsert card %s: %v", c.ID, err))
					mu.Unlock()
					continue
				}
				cardCount++
			}

			mu.Lock()
			syncedSets++
			syncedCards += cardCount
			mu.Unlock()
		}(resume.ID)
	}
	wg.Wait()

	log.Printf("✅ Synced %d sets / %d cards (%d/%d operations failed)\n", syncedSets, syncedCards, len(setErrs), totalOps)
	for _, e := range setErrs {
		log.Println("   ⚠️", e)
	}

	// A handful of failures (a card TCGdex briefly 404s on, a transient
	// network blip) is normal and safe to ignore - the next run retries it.
	// A high failure rate means something systemic is wrong (most commonly:
	// DATABASE_URL points at Neon's pooled/PgBouncer endpoint, which doesn't
	// support the concurrent prepared-statement writes this job does) and
	// should fail the job loudly instead of silently leaving the catalog
	// half-populated.
	if rate := errorRate(len(setErrs), totalOps); rate > maxAcceptableErrorRate {
		return fmt.Errorf("catalog sync aborted: %d/%d set/card writes failed (%.0f%%) - this usually means DATABASE_URL is a pooled/PgBouncer connection string, which doesn't support this job's concurrent writes; use Neon's direct (non-pooled) connection string instead", len(setErrs), totalOps, rate*100)
	}

	return enrichPendingCards(db)
}

const maxAcceptableErrorRate = 0.05

func errorRate(failed, total int) float64 {
	if total == 0 {
		return 0
	}
	return float64(failed) / float64(total)
}

func upsertSeries(db *sql.DB, id, name string) error {
	_, err := db.Exec(`
		INSERT INTO series (id, name) VALUES ($1, $2)
		ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, id, name)
	return err
}

func upsertSet(db *sql.DB, set *tcgdexSet, raw []byte, isPocket bool) error {
	_, err := db.Exec(`
		INSERT INTO sets (id, name, logo, symbol, serie_id, release_date, card_count_total, card_count_official, is_pocket, raw_data, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			logo = EXCLUDED.logo,
			symbol = EXCLUDED.symbol,
			serie_id = EXCLUDED.serie_id,
			release_date = EXCLUDED.release_date,
			card_count_total = EXCLUDED.card_count_total,
			card_count_official = EXCLUDED.card_count_official,
			is_pocket = EXCLUDED.is_pocket,
			raw_data = EXCLUDED.raw_data,
			updated_at = CURRENT_TIMESTAMP`,
		set.ID, set.Name, set.Logo, set.Symbol, set.Serie.ID, set.ReleaseDate,
		set.CardCount.Total, set.CardCount.Official, isPocket, string(raw))
	return err
}

// upsertCardResume writes the identity fields we get for free from the set
// listing. It deliberately never touches category/rarity/hp/types/raw_data
// on conflict, so an already-enriched card keeps its detail.
func upsertCardResume(db *sql.DB, c tcgdexCardResume, setID string, isPocket bool) error {
	_, err := db.Exec(`
		INSERT INTO cards (id, local_id, name, image, set_id, is_pocket, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			local_id = EXCLUDED.local_id,
			name = EXCLUDED.name,
			image = EXCLUDED.image,
			set_id = EXCLUDED.set_id,
			is_pocket = EXCLUDED.is_pocket,
			updated_at = CURRENT_TIMESTAMP`,
		c.ID, c.LocalID, c.Name, c.Image, setID, isPocket)
	return err
}

// enrichPendingCards fills in rarity/category/hp/types/raw_data for any card
// that doesn't have them yet (new cards from this run, or ones that failed
// enrichment previously). Already-enriched cards are skipped, so repeated
// nightly runs stay cheap.
func enrichPendingCards(db *sql.DB) error {
	rows, err := db.Query(`SELECT id FROM cards WHERE raw_data IS NULL`)
	if err != nil {
		return fmt.Errorf("listing cards pending enrichment: %w", err)
	}
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		ids = append(ids, id)
	}
	rows.Close()

	if len(ids) == 0 {
		log.Println("✅ No cards pending detail enrichment")
		return nil
	}
	log.Printf("📡 Enriching %d cards with full detail from TCGdex...\n", len(ids))

	var (
		mu     sync.Mutex
		done   int
		failed []string
	)
	sem := make(chan struct{}, syncConcurrency)
	var wg sync.WaitGroup

	for _, id := range ids {
		wg.Add(1)
		sem <- struct{}{}
		go func(cardID string) {
			defer wg.Done()
			defer func() { <-sem }()

			card, raw, err := fetchCard(cardID)
			if err != nil {
				mu.Lock()
				failed = append(failed, fmt.Sprintf("%s: %v", cardID, err))
				mu.Unlock()
				return
			}

			var hp interface{}
			if card.HP != nil {
				hp = *card.HP
			}

			_, err = db.Exec(`
				UPDATE cards SET
					category = $1,
					rarity = $2,
					hp = $3,
					types = $4,
					raw_data = $5,
					details_synced_at = CURRENT_TIMESTAMP,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = $6`,
				card.Category, card.Rarity, hp, pq.Array(card.Types), string(raw), cardID)
			if err != nil {
				mu.Lock()
				failed = append(failed, fmt.Sprintf("%s: db update failed: %v", cardID, err))
				mu.Unlock()
				return
			}

			mu.Lock()
			done++
			mu.Unlock()
		}(id)
	}
	wg.Wait()

	log.Printf("✅ Enriched %d/%d cards (%d failed)\n", done, len(ids), len(failed))
	if len(failed) > 0 {
		max := len(failed)
		if max > 20 {
			max = 20
		}
		log.Println("   ⚠️ " + strings.Join(failed[:max], "\n   ⚠️ "))
	}

	if rate := errorRate(len(failed), len(ids)); rate > maxAcceptableErrorRate {
		return fmt.Errorf("card enrichment aborted: %d/%d cards failed (%.0f%%) - this usually means DATABASE_URL is a pooled/PgBouncer connection string, which doesn't support this job's concurrent writes; use Neon's direct (non-pooled) connection string instead", len(failed), len(ids), rate*100)
	}
	return nil
}
