package model

import (
	"time"
)

type User struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	Password    string    `json:"-"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	Avatar      *string   `json:"avatar,omitempty"`
	Nickname    *string   `json:"nickname,omitempty"`
	AboutMe     *string   `json:"about_me,omitempty"`
	IsPublic    bool      `json:"is_public"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RegisterInput struct {
	Email       string  `json:"email"`
	Password    string  `json:"password"`
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	DateOfBirth string  `json:"date_of_birth"`
	Avatar      *string `json:"avatar,omitempty"`
	Nickname    *string `json:"nickname,omitempty"`
	AboutMe     *string `json:"about_me,omitempty"`
	IsPublic    bool    `json:"is_public"` // Add IsPublic here
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
