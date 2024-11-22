package service

import (
	"database/sql"
	"errors"
	"social-network/internal/model"
	"time"

	"github.com/google/uuid"
)

type GroupService struct {
	db *sql.DB
}

func NewGroupService(db *sql.DB) *GroupService {
	return &GroupService{db: db}
}

// Group management
func (s *GroupService) CreateGroup(creatorID string, input model.CreateGroupInput) (*model.Group, error) {
	group := &model.Group{
		ID:          uuid.New().String(),
		CreatorID:   creatorID,
		Title:       input.Title,
		Description: input.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
        INSERT INTO groups (id, creator_id, title, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
		group.ID, group.CreatorID, group.Title, group.Description,
		group.CreatedAt, group.UpdatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(`
        INSERT INTO group_members (group_id, user_id, status)
        VALUES (?, ?, 'accepted')`,
		group.ID, creatorID)
	if err != nil {
		return nil, err
	}

	return group, tx.Commit()
}

func (s *GroupService) InviteToGroup(groupID string, inviterID string, userIDs []string) error {
	var status string
	err := s.db.QueryRow(`
        SELECT status FROM group_members 
        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`,
		groupID, inviterID).Scan(&status)
	if err != nil {
		return errors.New("not authorized to invite to this group")
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, userID := range userIDs {
		_, err = tx.Exec(`
            INSERT OR IGNORE INTO group_members (group_id, user_id, status)
            VALUES (?, ?, 'pending')`,
			groupID, userID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *GroupService) RespondToInvite(groupID string, userID string, accept bool) error {
	// Verify the invitation exists
	var status string
	err := s.db.QueryRow(`
        SELECT status FROM group_members 
        WHERE group_id = ? AND user_id = ? AND status = 'pending'`,
		groupID, userID).Scan(&status)
	if err != nil {
		return errors.New("no pending invitation found")
	}

	newStatus := "declined"
	if accept {
		newStatus = "accepted"
	}

	_, err = s.db.Exec(`
        UPDATE group_members 
        SET status = ?, updated_at = ? 
        WHERE group_id = ? AND user_id = ?`,
		newStatus, time.Now(), groupID, userID)

	return err
}

func (s *GroupService) GetPendingInvites(userID string) ([]model.Group, error) {
	rows, err := s.db.Query(`
        SELECT g.id, g.creator_id, g.title, g.description, g.created_at, g.updated_at
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ? AND gm.status = 'pending'`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []model.Group
	for rows.Next() {
		var group model.Group
		if err := rows.Scan(
			&group.ID,
			&group.CreatorID,
			&group.Title,
			&group.Description,
			&group.CreatedAt,
			&group.UpdatedAt,
		); err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}
	return groups, nil
}

func (s *GroupService) GetAllGroups() ([]model.Group, error) {
	rows, err := s.db.Query(`
        SELECT id, creator_id, title, description, created_at, updated_at
        FROM groups
        ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []model.Group
	for rows.Next() {
		var group model.Group
		if err := rows.Scan(
			&group.ID,
			&group.CreatorID,
			&group.Title,
			&group.Description,
			&group.CreatedAt,
			&group.UpdatedAt,
		); err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return groups, nil
}

// Post management
func (s *GroupService) CreateGroupPost(groupID string, userID string, content string, imagePath *string) (*model.GroupPost, error) {
	if err := s.verifyMembership(groupID, userID); err != nil {
		return nil, err
	}

	post := &model.GroupPost{
		ID:        uuid.New().String(),
		GroupID:   groupID,
		UserID:    userID,
		Content:   content,
		ImagePath: imagePath,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err := s.db.Exec(`
        INSERT INTO group_posts (id, group_id, user_id, content, image_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
		post.ID, post.GroupID, post.UserID, post.Content, post.ImagePath,
		post.CreatedAt, post.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return post, nil
}

func (s *GroupService) GetGroupPosts(groupID string, userID string) ([]model.GroupPost, error) {
	if err := s.verifyMembership(groupID, userID); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(`
        SELECT id, group_id, user_id, content, image_path, created_at, updated_at
        FROM group_posts
        WHERE group_id = ?
        ORDER BY created_at DESC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.GroupPost
	for rows.Next() {
		var post model.GroupPost
		if err := rows.Scan(
			&post.ID, &post.GroupID, &post.UserID, &post.Content,
			&post.ImagePath, &post.CreatedAt, &post.UpdatedAt); err != nil {
			return nil, err
		}

		comments, err := s.getPostComments(post.ID)
		if err != nil {
			return nil, err
		}
		post.Comments = comments
		posts = append(posts, post)
	}

	return posts, nil
}

// Event management
func (s *GroupService) CreateEvent(groupID string, creatorID string, input model.CreateEventInput) (*model.GroupEvent, error) {
	if err := s.verifyMembership(groupID, creatorID); err != nil {
		return nil, err
	}

	eventTime, err := time.Parse(time.RFC3339, input.EventTime)
	if err != nil {
		return nil, errors.New("invalid event time format")
	}

	event := &model.GroupEvent{
		ID:          uuid.New().String(),
		GroupID:     groupID,
		CreatorID:   creatorID,
		Title:       input.Title,
		Description: input.Description,
		EventTime:   eventTime,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = s.db.Exec(`
        INSERT INTO group_events (id, group_id, creator_id, title, description, event_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		event.ID, event.GroupID, event.CreatorID, event.Title,
		event.Description, event.EventTime, event.CreatedAt, event.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return event, nil
}

func (s *GroupService) RespondToEvent(eventID string, userID string, response string) error {
	var groupID string
	err := s.db.QueryRow("SELECT group_id FROM group_events WHERE id = ?", eventID).Scan(&groupID)
	if err != nil {
		return err
	}

	if err := s.verifyMembership(groupID, userID); err != nil {
		return err
	}

	if response != "going" && response != "not_going" {
		return errors.New("invalid response type")
	}

	_, err = s.db.Exec(`
        INSERT OR REPLACE INTO event_responses (event_id, user_id, response, updated_at)
        VALUES (?, ?, ?, ?)`,
		eventID, userID, response, time.Now())

	return err
}

func (s *GroupService) GetEventResponses(eventID string, userID string) (map[string][]string, error) {
	// First verify the user is a member of the group
	var groupID string
	err := s.db.QueryRow(`
        SELECT group_id FROM group_events WHERE id = ?`,
		eventID).Scan(&groupID)
	if err != nil {
		return nil, err
	}

	if err := s.verifyMembership(groupID, userID); err != nil {
		return nil, err
	}

	// Get all responses
	rows, err := s.db.Query(`
        SELECT er.response, u.id, u.first_name, u.last_name
        FROM event_responses er
        JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ?`,
		eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	responses := map[string][]string{
		"going":     {},
		"not_going": {},
	}

	for rows.Next() {
		var response, userID, firstName, lastName string
		if err := rows.Scan(&response, &userID, &firstName, &lastName); err != nil {
			return nil, err
		}
		fullName := firstName + " " + lastName
		responses[response] = append(responses[response], fullName)
	}

	return responses, nil
}

func (s *GroupService) GetGroupEvents(groupID string, userID string) ([]model.GroupEvent, error) {
	if err := s.verifyMembership(groupID, userID); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(`
        SELECT id, group_id, creator_id, title, description, event_time, created_at, updated_at
        FROM group_events
        WHERE group_id = ?
        ORDER BY event_time DESC`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []model.GroupEvent
	for rows.Next() {
		var event model.GroupEvent
		if err := rows.Scan(
			&event.ID, &event.GroupID, &event.CreatorID, &event.Title,
			&event.Description, &event.EventTime, &event.CreatedAt, &event.UpdatedAt); err != nil {
			return nil, err
		}

		responses, err := s.getEventResponses(event.ID)
		if err != nil {
			return nil, err
		}
		event.Responses = responses
		events = append(events, event)
	}

	return events, nil
}

func (s *GroupService) verifyMembership(groupID string, userID string) error {
	var status string
	err := s.db.QueryRow(`
        SELECT status FROM group_members 
        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`,
		groupID, userID).Scan(&status)
	if err != nil {
		return errors.New("not a member of this group")
	}
	return nil
}

func (s *GroupService) getPostComments(postID string) ([]model.GroupPostComment, error) {
	rows, err := s.db.Query(`
        SELECT id, post_id, user_id, content, created_at, updated_at
        FROM group_post_comments
        WHERE post_id = ?
        ORDER BY created_at ASC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []model.GroupPostComment
	for rows.Next() {
		var comment model.GroupPostComment
		if err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.UserID,
			&comment.Content, &comment.CreatedAt, &comment.UpdatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func (s *GroupService) getEventResponses(eventID string) (map[string]string, error) {
	rows, err := s.db.Query(`
        SELECT user_id, response
        FROM event_responses
        WHERE event_id = ?`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	responses := make(map[string]string)
	for rows.Next() {
		var userID, response string
		if err := rows.Scan(&userID, &response); err != nil {
			return nil, err
		}
		responses[userID] = response
	}
	return responses, nil
}
