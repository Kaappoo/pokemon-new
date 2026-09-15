package main

import "time"

// User represents a user account
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Bio          string    `json:"bio"`
	AvatarURL    string    `json:"avatar_url"`
	FavoriteCard string    `json:"favorite_card"`
	CreatedAt    time.Time `json:"created_at"`
}

// WishlistItem represents a card saved in a user's wishlist
type WishlistItem struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	CardID    string    `json:"card_id"`
	CardName  string    `json:"card_name"`
	CardImage string    `json:"card_image"`
	SetID     string    `json:"set_id"`
	SetName   string    `json:"set_name"`
	CreatedAt time.Time `json:"created_at"`
}

// CollectionItem represents a card in a user's collection
type CollectionItem struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	CardID    string    `json:"card_id"`
	CardName  string    `json:"card_name"`
	CardImage string    `json:"card_image"`
	SetID     string    `json:"set_id"`
	SetName   string    `json:"set_name"`
	Quantity  int       `json:"quantity"`
	Rarity    string    `json:"rarity"`
	CreatedAt time.Time `json:"created_at"`
}

// RegisterRequest holds registration payload
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest holds login payload
type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email"`
	Password        string `json:"password"`
}

// AuthResponse holds login/register success response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UpdateProfileRequest holds profile update payload
type UpdateProfileRequest struct {
	Bio          string `json:"bio"`
	AvatarURL    string `json:"avatar_url"`
	FavoriteCard string `json:"favorite_card"`
}

// WishlistRequest holds wishlist add payload
type WishlistRequest struct {
	CardID    string `json:"card_id"`
	CardName  string `json:"card_name"`
	CardImage string `json:"card_image"`
	SetID     string `json:"set_id"`
	SetName   string `json:"set_name"`
}

// CollectionRequest holds collection add/update payload
type CollectionRequest struct {
	CardID    string `json:"card_id"`
	CardName  string `json:"card_name"`
	CardImage string `json:"card_image"`
	SetID     string `json:"set_id"`
	SetName   string `json:"set_name"`
	Quantity  int    `json:"quantity"`
	Rarity    string `json:"rarity"`
}

// UserProfileResponse holds full user profile with stats and items
type UserProfileResponse struct {
	User            User             `json:"user"`
	WishlistCount   int              `json:"wishlist_count"`
	CollectionCount int              `json:"collection_count"`
	Wishlist        []WishlistItem   `json:"wishlist"`
	Collection      []CollectionItem `json:"collection"`
}
