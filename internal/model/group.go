package model

import "time"

type Group struct {
	ID          string    `json:"id"`
	CreatorID   string    `json:"creator_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateGroupInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type GroupMember struct {
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GroupPost struct {
	ID        string             `json:"id"`
	GroupID   string             `json:"group_id"`
	UserID    string             `json:"user_id"`
	Content   string             `json:"content"`
	ImagePath *string            `json:"image_path,omitempty"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	Comments  []GroupPostComment `json:"comments,omitempty"`
}

type GroupPostComment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GroupEvent struct {
	ID          string            `json:"id"`
	GroupID     string            `json:"group_id"`
	CreatorID   string            `json:"creator_id"`
	Title       string            `json:"title"`
	Description string            `json:"description"`
	EventTime   time.Time         `json:"event_time"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Responses   map[string]string `json:"responses,omitempty"` // userID -> response
}

type CreateEventInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventTime   string `json:"event_time"` // Format: "2006-01-02T15:04:05Z"
}

type EventResponse struct {
	EventID  string `json:"event_id"`
	Response string `json:"response"` // "going" or "not_going"
}
