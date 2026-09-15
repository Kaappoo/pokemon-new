package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Minimal REST client for the TCGdex API (https://tcgdex.dev). No API key
// required. We talk to the raw REST endpoints directly instead of pulling in
// the JS SDK, since the backend is Go.
const (
	tcgdexBaseURL       = "https://api.tcgdex.net/v2/en"
	tcgdexPocketSerieID = "tcgp" // TCGdex groups every Pokémon TCG Pocket set/card under this serie
)

var errTCGdexNotFound = errors.New("tcgdex: not found")

var tcgdexHTTPClient = &http.Client{Timeout: 30 * time.Second}

type tcgdexSerieResume struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type tcgdexSetResume struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type tcgdexCardResume struct {
	ID      string `json:"id"`
	LocalID string `json:"localId"`
	Name    string `json:"name"`
	Image   string `json:"image"`
}

type tcgdexSet struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Logo        string            `json:"logo"`
	Symbol      string            `json:"symbol"`
	Serie       tcgdexSerieResume `json:"serie"`
	ReleaseDate string            `json:"releaseDate"`
	CardCount   struct {
		Total    int `json:"total"`
		Official int `json:"official"`
	} `json:"cardCount"`
	Cards []tcgdexCardResume `json:"cards"`
}

type tcgdexCard struct {
	ID       string   `json:"id"`
	LocalID  string   `json:"localId"`
	Name     string   `json:"name"`
	Image    string   `json:"image"`
	Category string   `json:"category"`
	Rarity   string   `json:"rarity"`
	HP       *int     `json:"hp"`
	Types    []string `json:"types"`
}

// tcgdexGetRaw fetches a path relative to tcgdexBaseURL and returns the raw
// response body, so callers can both decode it into a typed struct and
// persist/forward the exact original JSON.
func tcgdexGetRaw(path string) ([]byte, error) {
	reqURL := tcgdexBaseURL + path
	resp, err := tcgdexHTTPClient.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("tcgdex request to %s failed: %w", reqURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, errTCGdexNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tcgdex request to %s returned status %d", reqURL, resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// fetchAllSetResumes lists every set TCGdex knows about (both physical TCG
// and TCG Pocket) - a couple hundred items, no pagination needed.
func fetchAllSetResumes() ([]tcgdexSetResume, error) {
	body, err := tcgdexGetRaw("/sets")
	if err != nil {
		return nil, err
	}
	var sets []tcgdexSetResume
	if err := json.Unmarshal(body, &sets); err != nil {
		return nil, fmt.Errorf("decoding /sets response: %w", err)
	}
	return sets, nil
}

// fetchSet fetches full detail for one set, including its serie (used to
// derive is_pocket) and the resume list of every card in it.
func fetchSet(id string) (*tcgdexSet, []byte, error) {
	body, err := tcgdexGetRaw("/sets/" + url.PathEscape(id))
	if err != nil {
		return nil, nil, err
	}
	var s tcgdexSet
	if err := json.Unmarshal(body, &s); err != nil {
		return nil, nil, fmt.Errorf("decoding set %s: %w", id, err)
	}
	return &s, body, nil
}

// fetchCard fetches full detail for one card (rarity, category, hp, types,
// attacks, etc). Used to enrich cards beyond what the set listing gives us.
func fetchCard(id string) (*tcgdexCard, []byte, error) {
	body, err := tcgdexGetRaw("/cards/" + url.PathEscape(id))
	if err != nil {
		return nil, nil, err
	}
	var c tcgdexCard
	if err := json.Unmarshal(body, &c); err != nil {
		return nil, nil, fmt.Errorf("decoding card %s: %w", id, err)
	}
	return &c, body, nil
}
