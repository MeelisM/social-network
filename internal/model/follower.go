package model

import "time"

type FollowRequest struct {
	ID          string    `json:"id"`
	FollowerID  string    `json:"follower_id"`
	FollowingID string    `json:"following_id"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type FollowResponse struct {
	RequestID string `json:"request_id"`
	Accept    bool   `json:"accept"`
}
