package model

import "time"

type Post struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	ImagePath *string   `json:"image_path,omitempty"`
	Privacy   string    `json:"privacy"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	ViewerIDs []string  `json:"viewer_ids,omitempty"`
}

type CreatePostInput struct {
	Content   string   `json:"content"`
	ImagePath *string  `json:"image_path,omitempty"`
	Privacy   string   `json:"privacy"`
	ViewerIDs []string `json:"viewer_ids,omitempty"`
}

type UpdatePostInput struct {
	Content   *string   `json:"content,omitempty"`
	ImagePath *string   `json:"image_path,omitempty"`
	Privacy   *string   `json:"privacy,omitempty"`
	ViewerIDs *[]string `json:"viewer_ids,omitempty"`
}
