package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnvOrDefault("JWT_SECRET", "poke-cards-super-secret-jwt-key-2026"))

func getEnvOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

type contextKey string

const userIDKey contextKey = "userID"

// Helper to write JSON response
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// Helper to write JSON error
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// Generate JWT token for user
func GenerateToken(userID int, username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"usr": username,
	})
	return token.SignedString(jwtSecret)
}

// AuthMiddleware extracts JWT and injects User ID into context
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeError(w, http.StatusUnauthorized, "invalid authorization format")
			return
		}

		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeError(w, http.StatusUnauthorized, "failed to parse claims")
			return
		}

		userIDFloat, ok := claims["sub"].(float64)
		if !ok {
			writeError(w, http.StatusUnauthorized, "invalid user ID claim")
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, int(userIDFloat))
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// CORSMiddleware enables CORS for frontend clients
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RegisterHandler handles user registration
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Username == "" || req.Email == "" || len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "username and email required; password must be at least 6 characters")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	var user User
	err = db.QueryRow(`
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, bio, avatar_url, favorite_card, created_at`,
		req.Username, req.Email, string(hashedPassword),
	).Scan(&user.ID, &user.Username, &user.Email, &user.Bio, &user.AvatarURL, &user.FavoriteCard, &user.CreatedAt)

	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "unique") || strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "UNIQUE constraint") {
			if strings.Contains(errStr, "email") {
				writeError(w, http.StatusConflict, "an account with this email already exists")
			} else {
				writeError(w, http.StatusConflict, "username is already taken")
			}
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create user: "+err.Error())
		return
	}

	token, err := GenerateToken(user.ID, user.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate authentication token")
		return
	}

	writeJSON(w, http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

// LoginHandler handles user login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	identifier := strings.TrimSpace(req.UsernameOrEmail)
	if identifier == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username/email and password are required")
		return
	}

	var u User
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, bio, avatar_url, favorite_card, created_at
		FROM users
		WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`, identifier).
		Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Bio, &u.AvatarURL, &u.FavoriteCard, &u.CreatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "invalid username/email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}

	if err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid username/email or password")
		return
	}

	token, err := GenerateToken(u.ID, u.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		Token: token,
		User:  u,
	})
}

// GetProfileHandler returns detailed profile of logged in user
func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	var u User
	err := db.QueryRow(`
		SELECT id, username, email, bio, avatar_url, favorite_card, created_at
		FROM users WHERE id = $1`, userID).
		Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.AvatarURL, &u.FavoriteCard, &u.CreatedAt)

	if err != nil {
		writeError(w, http.StatusNotFound, "user profile not found")
		return
	}

	// Fetch Wishlist Items
	wishlistRows, err := db.Query(`
		SELECT id, user_id, card_id, card_name, card_image, set_id, set_name, created_at
		FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	var wishlist []WishlistItem
	if err == nil {
		defer wishlistRows.Close()
		for wishlistRows.Next() {
			var wItem WishlistItem
			if err := wishlistRows.Scan(&wItem.ID, &wItem.UserID, &wItem.CardID, &wItem.CardName, &wItem.CardImage, &wItem.SetID, &wItem.SetName, &wItem.CreatedAt); err == nil {
				wishlist = append(wishlist, wItem)
			}
		}
	}

	// Fetch Collection Items
	collectionRows, err := db.Query(`
		SELECT id, user_id, card_id, card_name, card_image, set_id, set_name, quantity, rarity, created_at
		FROM collections WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	var collection []CollectionItem
	if err == nil {
		defer collectionRows.Close()
		for collectionRows.Next() {
			var cItem CollectionItem
			if err := collectionRows.Scan(&cItem.ID, &cItem.UserID, &cItem.CardID, &cItem.CardName, &cItem.CardImage, &cItem.SetID, &cItem.SetName, &cItem.Quantity, &cItem.Rarity, &cItem.CreatedAt); err == nil {
				collection = append(collection, cItem)
			}
		}
	}

	writeJSON(w, http.StatusOK, UserProfileResponse{
		User:            u,
		WishlistCount:   len(wishlist),
		CollectionCount: len(collection),
		Wishlist:        wishlist,
		Collection:      collection,
	})
}

// UpdateProfileHandler updates profile details
func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var u User
	err := db.QueryRow(`
		UPDATE users
		SET bio = $1, avatar_url = $2, favorite_card = $3
		WHERE id = $4
		RETURNING id, username, email, bio, avatar_url, favorite_card, created_at`,
		req.Bio, req.AvatarURL, req.FavoriteCard, userID).
		Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.AvatarURL, &u.FavoriteCard, &u.CreatedAt)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	writeJSON(w, http.StatusOK, u)
}

// GetWishlistHandler returns user's wishlist
func GetWishlistHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	rows, err := db.Query(`
		SELECT id, user_id, card_id, card_name, card_image, set_id, set_name, created_at
		FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch wishlist")
		return
	}
	defer rows.Close()

	wishlist := []WishlistItem{}
	for rows.Next() {
		var wItem WishlistItem
		if err := rows.Scan(&wItem.ID, &wItem.UserID, &wItem.CardID, &wItem.CardName, &wItem.CardImage, &wItem.SetID, &wItem.SetName, &wItem.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan wishlist row")
			return
		}
		wishlist = append(wishlist, wItem)
	}

	writeJSON(w, http.StatusOK, wishlist)
}

// AddWishlistHandler adds card to wishlist
func AddWishlistHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	var req WishlistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CardID == "" || req.CardName == "" {
		writeError(w, http.StatusBadRequest, "card_id and card_name are required")
		return
	}

	var wItem WishlistItem
	err := db.QueryRow(`
		INSERT INTO wishlists (user_id, card_id, card_name, card_image, set_id, set_name)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, card_id) DO UPDATE SET created_at = CURRENT_TIMESTAMP
		RETURNING id, user_id, card_id, card_name, card_image, set_id, set_name, created_at`,
		userID, req.CardID, req.CardName, req.CardImage, req.SetID, req.SetName,
	).Scan(&wItem.ID, &wItem.UserID, &wItem.CardID, &wItem.CardName, &wItem.CardImage, &wItem.SetID, &wItem.SetName, &wItem.CreatedAt)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to add card to wishlist: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, wItem)
}

// DeleteWishlistHandler deletes card from wishlist
func DeleteWishlistHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete && r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	cardID := r.URL.Query().Get("card_id")
	if cardID == "" {
		// Try parsing from body
		var body struct {
			CardID string `json:"card_id"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		cardID = body.CardID
	}

	if cardID == "" {
		writeError(w, http.StatusBadRequest, "missing card_id parameter")
		return
	}

	res, err := db.Exec("DELETE FROM wishlists WHERE user_id = $1 AND card_id = $2", userID, cardID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete item from wishlist")
		return
	}

	rowsAffected, _ := res.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"rows_affected": rowsAffected,
		"message":       "Card removed from wishlist",
	})
}

// CheckWishlistHandler checks if a card is in user's wishlist
func CheckWishlistHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	cardID := r.URL.Query().Get("card_id")
	if cardID == "" {
		writeError(w, http.StatusBadRequest, "missing card_id parameter")
		return
	}

	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM wishlists WHERE user_id = $1 AND card_id = $2", userID, cardID).Scan(&count)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"card_id":     cardID,
		"in_wishlist": count > 0,
	})
}

// GetCollectionHandler returns user's collection
func GetCollectionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	rows, err := db.Query(`
		SELECT id, user_id, card_id, card_name, card_image, set_id, set_name, quantity, rarity, created_at
		FROM collections WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch collection")
		return
	}
	defer rows.Close()

	collection := []CollectionItem{}
	for rows.Next() {
		var cItem CollectionItem
		if err := rows.Scan(&cItem.ID, &cItem.UserID, &cItem.CardID, &cItem.CardName, &cItem.CardImage, &cItem.SetID, &cItem.SetName, &cItem.Quantity, &cItem.Rarity, &cItem.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan collection row")
			return
		}
		collection = append(collection, cItem)
	}

	writeJSON(w, http.StatusOK, collection)
}

// AddCollectionHandler adds/updates card in collection
func AddCollectionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	var req CollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CardID == "" || req.CardName == "" {
		writeError(w, http.StatusBadRequest, "card_id and card_name are required")
		return
	}

	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	var cItem CollectionItem
	err := db.QueryRow(`
		INSERT INTO collections (user_id, card_id, card_name, card_image, set_id, set_name, quantity, rarity)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = collections.quantity + EXCLUDED.quantity
		RETURNING id, user_id, card_id, card_name, card_image, set_id, set_name, quantity, rarity, created_at`,
		userID, req.CardID, req.CardName, req.CardImage, req.SetID, req.SetName, req.Quantity, req.Rarity,
	).Scan(&cItem.ID, &cItem.UserID, &cItem.CardID, &cItem.CardName, &cItem.CardImage, &cItem.SetID, &cItem.SetName, &cItem.Quantity, &cItem.Rarity, &cItem.CreatedAt)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update collection: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, cItem)
}

// DeleteCollectionHandler removes card from collection
func DeleteCollectionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete && r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.Context().Value(userIDKey).(int)

	cardID := r.URL.Query().Get("card_id")
	if cardID == "" {
		writeError(w, http.StatusBadRequest, "missing card_id parameter")
		return
	}

	_, err := db.Exec("DELETE FROM collections WHERE user_id = $1 AND card_id = $2", userID, cardID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete card from collection")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Card removed from collection",
	})
}
