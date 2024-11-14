package service

import (
	"database/sql"
	"errors"
	"social-network/internal/model"
	"time"

	"github.com/google/uuid"
)

type FollowerService struct {
	db *sql.DB
}

func NewFollowerService(db *sql.DB) *FollowerService {
	return &FollowerService{db: db}
}

func (s *FollowerService) SendFollowRequest(followerID, followingID string) (*model.FollowRequest, error) {
	if followerID == followingID {
		return nil, errors.New("cannot follow yourself")
	}

	// Check if user being followed exists and is public
	var isPublic bool
	err := s.db.QueryRow("SELECT is_public FROM users WHERE id = ?", followingID).Scan(&isPublic)
	if err != nil {
		return nil, err
	}

	// Check if already following
	var existingRequest model.FollowRequest
	err = s.db.QueryRow(`
        SELECT id, status FROM follow_requests 
        WHERE follower_id = ? AND following_id = ?`,
		followerID, followingID).Scan(&existingRequest.ID, &existingRequest.Status)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if err == nil && existingRequest.Status == "accepted" {
		return nil, errors.New("already following this user")
	}

	status := "pending"
	if isPublic {
		status = "accepted"
	}

	request := &model.FollowRequest{
		ID:          uuid.New().String(),
		FollowerID:  followerID,
		FollowingID: followingID,
		Status:      status,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = s.db.Exec(`
        INSERT INTO follow_requests (id, follower_id, following_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
		request.ID, request.FollowerID, request.FollowingID,
		request.Status, request.CreatedAt, request.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return request, nil
}

func (s *FollowerService) RespondToRequest(requestID string, userID string, accept bool) error {
	var followingID string
	err := s.db.QueryRow("SELECT following_id FROM follow_requests WHERE id = ?", requestID).
		Scan(&followingID)
	if err != nil {
		return err
	}

	if followingID != userID {
		return errors.New("unauthorized to respond to this request")
	}

	status := "declined"
	if accept {
		status = "accepted"
	}

	_, err = s.db.Exec(`
        UPDATE follow_requests 
        SET status = ?, updated_at = ? 
        WHERE id = ?`,
		status, time.Now(), requestID)

	return err
}

func (s *FollowerService) GetFollowers(userID string) ([]string, error) {
	rows, err := s.db.Query(`
        SELECT follower_id FROM follow_requests 
        WHERE following_id = ? AND status = 'accepted'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []string
	for rows.Next() {
		var followerID string
		if err := rows.Scan(&followerID); err != nil {
			return nil, err
		}
		followers = append(followers, followerID)
	}
	return followers, nil
}

func (s *FollowerService) GetFollowing(userID string) ([]string, error) {
	rows, err := s.db.Query(`
        SELECT following_id FROM follow_requests 
        WHERE follower_id = ? AND status = 'accepted'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []string
	for rows.Next() {
		var followingID string
		if err := rows.Scan(&followingID); err != nil {
			return nil, err
		}
		following = append(following, followingID)
	}
	return following, nil
}

func (s *FollowerService) GetPendingRequests(userID string) ([]model.FollowRequest, error) {
	rows, err := s.db.Query(`
        SELECT id, follower_id, following_id, status, created_at, updated_at 
        FROM follow_requests 
        WHERE following_id = ? AND status = 'pending'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []model.FollowRequest
	for rows.Next() {
		var req model.FollowRequest
		if err := rows.Scan(
			&req.ID, &req.FollowerID, &req.FollowingID,
			&req.Status, &req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, nil
}
