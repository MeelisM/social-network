package model

import "time"

type Notification struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Type        string    `json:"type"`
	Content     string    `json:"content"`
	ReferenceID string    `json:"reference_id"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

type NotificationMessage struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}
