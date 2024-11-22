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

func (s *FollowerService) GetFollowers(userID string) ([]map[string]string, error) {
	rows, err := s.db.Query(`
        SELECT u.id, COALESCE(u.nickname, '') AS nickname 
        FROM follow_requests 
        INNER JOIN users u ON follow_requests.follower_id = u.id
        WHERE follow_requests.following_id = ? AND follow_requests.status = 'accepted'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []map[string]string
	for rows.Next() {
		var id, nickname string
		if err := rows.Scan(&id, &nickname); err != nil {
			return nil, err
		}
		followers = append(followers, map[string]string{"id": id, "nickname": nickname})
	}
	return followers, nil
}

func (s *FollowerService) GetFollowing(userID string) ([]map[string]string, error) {
	rows, err := s.db.Query(`
        SELECT u.id, u.nickname 
        FROM follow_requests 
        INNER JOIN users u ON follow_requests.following_id = u.id
        WHERE follow_requests.follower_id = ? AND follow_requests.status = 'accepted'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var following []map[string]string
	for rows.Next() {
		var id, nickname string
		if err := rows.Scan(&id, &nickname); err != nil {
			return nil, err
		}
		following = append(following, map[string]string{"id": id, "nickname": nickname})
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

func (s *FollowerService) GetFollowStatus(followerID, followingID string, status *string) error {
	err := s.db.QueryRow(`
        SELECT status FROM follow_requests
        WHERE follower_id = ? AND following_id = ?`, followerID, followingID).Scan(status)
	if err == sql.ErrNoRows {
		*status = "not_followed"
		return nil
	}
	return err
}
