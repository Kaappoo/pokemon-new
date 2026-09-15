package main

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"strings"
)

func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}

func main() {
	loadEnvFile(".env")
	dbURL := os.Getenv("DATABASE_URL")
	port := "8080"
	if val, ok := os.LookupEnv("PORT"); ok {
		port = val
	}

	// `go run . sync` runs the TCGdex catalog sync once and exits, instead of
	// starting the HTTP server. Intended to be run manually or on a schedule
	// (cron / CI job) to keep the sets/cards tables up to date.
	if len(os.Args) > 1 && os.Args[1] == "sync" {
		if dbURL == "" {
			fmt.Println("❌ DATABASE_URL is not set; cannot run catalog sync.")
			os.Exit(1)
		}
		database, err := InitDB(dbURL)
		if err != nil {
			fmt.Printf("❌ Fatal error connecting to Neon PostgreSQL database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		if err := SyncCatalog(database); err != nil {
			fmt.Printf("❌ Catalog sync failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("✅ Catalog sync complete.")
		return
	}

	fmt.Println("⚡ Starting Poké Cards Go Backend with Neon PostgreSQL...")

	if dbURL == "" {
		fmt.Println("⚠️  WARNING: DATABASE_URL environment variable is not set!")
		fmt.Println("   Please set DATABASE_URL=postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require")
		fmt.Println("   Starting in pending configuration mode (server will respond to health requests).")
	} else {
		database, err := InitDB(dbURL)
		if err != nil {
			fmt.Printf("❌ Fatal error connecting to Neon PostgreSQL database: %v\n", err)
			fmt.Println("   Make sure your Neon DATABASE_URL is correct and has sslmode=require")
			os.Exit(1)
		}
		defer database.Close()
		fmt.Println("✅ Neon PostgreSQL Database initialized and migrated successfully!")
	}

	mux := http.NewServeMux()

	// Public Auth endpoints
	mux.HandleFunc("/api/register", RegisterHandler)
	mux.HandleFunc("/api/login", LoginHandler)

	// Card catalog endpoints (synced from TCGdex, see catalog_sync.go)
	mux.HandleFunc("GET /api/sets", ListSetsHandler)
	mux.HandleFunc("GET /api/sets/all", ListAllSetsHandler)
	mux.HandleFunc("GET /api/sets/{id}", GetSetHandler)
	mux.HandleFunc("GET /api/cards", ListCardsHandler)
	mux.HandleFunc("GET /api/cards/{id}", GetCardHandler)
	mux.HandleFunc("GET /api/types", ListTypesHandler)

	// Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"status":   "ok",
			"service":  "pokemon-cards-backend",
			"database": dbURL != "",
		})
	})

	// Protected User Profile endpoints
	mux.HandleFunc("/api/user/profile", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut || r.Method == http.MethodPost {
			AuthMiddleware(UpdateProfileHandler)(w, r)
		} else {
			AuthMiddleware(GetProfileHandler)(w, r)
		}
	})

	// Protected Wishlist endpoints
	mux.HandleFunc("/api/wishlist", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			AuthMiddleware(GetWishlistHandler)(w, r)
		case http.MethodPost:
			AuthMiddleware(AddWishlistHandler)(w, r)
		case http.MethodDelete:
			AuthMiddleware(DeleteWishlistHandler)(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})
	mux.HandleFunc("/api/wishlist/check", AuthMiddleware(CheckWishlistHandler))

	// Protected Collection endpoints
	mux.HandleFunc("/api/collection", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			AuthMiddleware(GetCollectionHandler)(w, r)
		case http.MethodPost:
			AuthMiddleware(AddCollectionHandler)(w, r)
		case http.MethodDelete:
			AuthMiddleware(DeleteCollectionHandler)(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	// Apply CORS wrapper
	handler := CORSMiddleware(mux)

	fmt.Printf("🚀 Server is running on http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		fmt.Printf("Fatal server error: %v\n", err)
		os.Exit(1)
	}
}
