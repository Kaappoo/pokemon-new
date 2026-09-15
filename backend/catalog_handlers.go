package main

import (
	"database/sql"
	"net/http"
	"strconv"
)

// ── Catalog read API (sets/cards synced from TCGdex, see catalog_sync.go) ──
//
// Every listing endpoint here excludes Pokémon TCG Pocket sets/cards by
// default (is_pocket = true), since that's a different product from the
// physical/paper TCG. Pass ?includePocket=true to include them.

type setListItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Logo   string `json:"logo,omitempty"`
	Symbol string `json:"symbol,omitempty"`
	Count  struct {
		Official int `json:"official"`
		Total    int `json:"total"`
	} `json:"cardCount"`
}

type cardListItem struct {
	ID      string `json:"id"`
	LocalID string `json:"localId"`
	Name    string `json:"name"`
	Image   string `json:"image"`
}

func parseIncludePocket(r *http.Request) bool {
	return r.URL.Query().Get("includePocket") == "true"
}

func parsePagination(r *http.Request, defaultPerPage int) (page, perPage int) {
	page, perPage = 1, defaultPerPage
	if v, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && v > 0 {
		page = v
	}
	if v, err := strconv.Atoi(r.URL.Query().Get("itemsPerPage")); err == nil && v > 0 {
		perPage = v
	}
	return
}

// ListSetsHandler handles GET /api/sets?page=&itemsPerPage=&includePocket=
func ListSetsHandler(w http.ResponseWriter, r *http.Request) {
	includePocket := parseIncludePocket(r)
	page, perPage := parsePagination(r, 20)
	offset := (page - 1) * perPage

	rows, err := db.Query(`
		SELECT id, name, logo, symbol, card_count_official, card_count_total
		FROM sets
		WHERE ($1 OR NOT is_pocket)
		ORDER BY release_date DESC, id DESC
		LIMIT $2 OFFSET $3`, includePocket, perPage, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch sets: "+err.Error())
		return
	}
	defer rows.Close()
	sets, err := scanSetRows(rows)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to scan set row")
		return
	}
	writeJSON(w, http.StatusOK, sets)
}

// ListAllSetsHandler handles GET /api/sets/all?includePocket= (used for
// dropdown/filter population - no pagination).
func ListAllSetsHandler(w http.ResponseWriter, r *http.Request) {
	includePocket := parseIncludePocket(r)

	rows, err := db.Query(`
		SELECT id, name, logo, symbol, card_count_official, card_count_total
		FROM sets
		WHERE ($1 OR NOT is_pocket)
		ORDER BY release_date DESC, id DESC`, includePocket)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch sets: "+err.Error())
		return
	}
	defer rows.Close()
	sets, err := scanSetRows(rows)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to scan set row")
		return
	}
	writeJSON(w, http.StatusOK, sets)
}

func scanSetRows(rows *sql.Rows) ([]setListItem, error) {
	sets := []setListItem{}
	for rows.Next() {
		var s setListItem
		if err := rows.Scan(&s.ID, &s.Name, &s.Logo, &s.Symbol, &s.Count.Official, &s.Count.Total); err != nil {
			return nil, err
		}
		sets = append(sets, s)
	}
	return sets, nil
}

// GetSetHandler handles GET /api/sets/{id} - full set detail including its
// card list, straight from the raw TCGdex payload captured at sync time.
func GetSetHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var raw []byte
	err := db.QueryRow(`SELECT raw_data FROM sets WHERE id = $1`, id).Scan(&raw)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "set not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch set: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

// ListCardsHandler handles GET /api/cards with name/set/type/category filters
// plus pagination, defaulting to physical-TCG-only results.
func ListCardsHandler(w http.ResponseWriter, r *http.Request) {
	includePocket := parseIncludePocket(r)
	page, perPage := parsePagination(r, 42)
	offset := (page - 1) * perPage

	name := r.URL.Query().Get("name")
	setID := r.URL.Query().Get("set")
	cardType := r.URL.Query().Get("type")
	category := r.URL.Query().Get("category")

	rows, err := db.Query(`
		SELECT c.id, c.local_id, c.name, c.image
		FROM cards c
		JOIN sets s ON s.id = c.set_id
		WHERE ($1 OR NOT c.is_pocket)
			AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
			AND ($3 = '' OR c.set_id = $3)
			AND ($4 = '' OR c.category = $4)
			AND ($5 = '' OR $5 = ANY(c.types))
			AND c.image <> ''
		ORDER BY s.release_date DESC, c.local_id
		LIMIT $6 OFFSET $7`,
		includePocket, name, setID, category, cardType, perPage, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch cards: "+err.Error())
		return
	}
	defer rows.Close()

	cards := []cardListItem{}
	for rows.Next() {
		var c cardListItem
		if err := rows.Scan(&c.ID, &c.LocalID, &c.Name, &c.Image); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan card row")
			return
		}
		cards = append(cards, c)
	}
	writeJSON(w, http.StatusOK, cards)
}

// GetCardHandler handles GET /api/cards/{id} - full card detail. Falls back
// to a live TCGdex lookup if the card hasn't been enriched locally yet (e.g.
// it was added to a set after the last sync run), so the page never 404s
// just because the nightly sync hasn't caught up.
func GetCardHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var raw sql.NullString
	err := db.QueryRow(`SELECT raw_data FROM cards WHERE id = $1`, id).Scan(&raw)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "card not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch card: "+err.Error())
		return
	}

	if raw.Valid {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(raw.String))
		return
	}

	_, liveRaw, err := fetchCard(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "card not found")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(liveRaw)
}

// ListTypesHandler handles GET /api/types - every distinct Pokémon type seen
// across enriched cards, for the filter dropdown.
func ListTypesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT DISTINCT t FROM cards, unnest(types) AS t
		ORDER BY t`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch types: "+err.Error())
		return
	}
	defer rows.Close()

	types := []string{}
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan type")
			return
		}
		types = append(types, t)
	}
	writeJSON(w, http.StatusOK, types)
}
