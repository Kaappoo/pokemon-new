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
