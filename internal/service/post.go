package service

import (
	"database/sql"
	"errors"
	"social-network/internal/model"
	"time"

	"github.com/google/uuid"
)

type PostService struct {
	db *sql.DB
}

func NewPostService(db *sql.DB) *PostService {
	return &PostService{db: db}
}

func (s *PostService) CreatePost(userID string, input model.CreatePostInput) (*model.Post, error) {
	post := &model.Post{
		ID:        uuid.New().String(),
		UserID:    userID,
		Content:   input.Content,
		ImagePath: input.ImagePath,
		Privacy:   input.Privacy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `INSERT INTO posts (id, user_id, content, image_path, privacy, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err = tx.Exec(query, post.ID, post.UserID, post.Content, post.ImagePath,
		post.Privacy, post.CreatedAt, post.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if input.Privacy == "almost_private" && len(input.ViewerIDs) > 0 {
		query = `INSERT INTO post_viewers (post_id, user_id) VALUES (?, ?)`
		for _, viewerID := range input.ViewerIDs {
			_, err = tx.Exec(query, post.ID, viewerID)
			if err != nil {
				return nil, err
			}
		}
		post.ViewerIDs = input.ViewerIDs
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return post, nil
}

func (s *PostService) GetPost(postID string, requestingUserID string) (*model.Post, error) {
	post := &model.Post{}
	query := `SELECT p.*, 
              CASE 
                WHEN p.privacy = 'public' THEN 1
                WHEN p.privacy = 'private' AND p.user_id = ? THEN 1
                WHEN p.privacy = 'almost_private' AND (p.user_id = ? OR EXISTS (
                    SELECT 1 FROM post_viewers pv WHERE pv.post_id = p.id AND pv.user_id = ?
                )) THEN 1
                ELSE 0 
              END as can_view
              FROM posts p WHERE p.id = ?`

	var canView bool
	err := s.db.QueryRow(query, requestingUserID, requestingUserID, requestingUserID, postID).
		Scan(&post.ID, &post.UserID, &post.Content, &post.ImagePath, &post.Privacy,
			&post.CreatedAt, &post.UpdatedAt, &canView)

	if err == sql.ErrNoRows {
		return nil, errors.New("post not found")
	}
	if err != nil {
		return nil, err
	}
	if !canView {
		return nil, errors.New("unauthorized to view this post")
	}

	return post, nil
}

func (s *PostService) UpdatePost(postID string, userID string, input model.UpdatePostInput) (*model.Post, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	post, err := s.GetPost(postID, userID)
	if err != nil {
		return nil, err
	}

	if post.UserID != userID {
		return nil, errors.New("unauthorized to update this post")
	}

	if input.Content != nil {
		post.Content = *input.Content
	}
	if input.ImagePath != nil {
		post.ImagePath = input.ImagePath
	}
	if input.Privacy != nil {
		post.Privacy = *input.Privacy
	}
	post.UpdatedAt = time.Now()

	query := `UPDATE posts SET content = ?, image_path = ?, privacy = ?, updated_at = ? WHERE id = ?`
	_, err = tx.Exec(query, post.Content, post.ImagePath, post.Privacy, post.UpdatedAt, post.ID)
	if err != nil {
		return nil, err
	}

	if input.ViewerIDs != nil && post.Privacy == "almost_private" {
		_, err = tx.Exec(`DELETE FROM post_viewers WHERE post_id = ?`, post.ID)
		if err != nil {
			return nil, err
		}

		query = `INSERT INTO post_viewers (post_id, user_id) VALUES (?, ?)`
		for _, viewerID := range *input.ViewerIDs {
			_, err = tx.Exec(query, post.ID, viewerID)
			if err != nil {
				return nil, err
			}
		}
		post.ViewerIDs = *input.ViewerIDs
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return post, nil
}

func (s *PostService) DeletePost(postID string, userID string) error {
	post, err := s.GetPost(postID, userID)
	if err != nil {
		return err
	}

	if post.UserID != userID {
		return errors.New("unauthorized to delete this post")
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM post_viewers WHERE post_id = ?`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *PostService) GetPublicPosts(requestingUserID string) ([]map[string]interface{}, error) {
	query := `
		SELECT p.*, 
			CASE 
				WHEN p.privacy = 'public' THEN 1
				WHEN p.privacy = 'private' AND p.user_id = ? THEN 1
				WHEN p.privacy = 'almost_private' AND (p.user_id = ? OR EXISTS (
					SELECT 1 FROM post_viewers pv WHERE pv.post_id = p.id AND pv.user_id = ?
				)) THEN 1
				ELSE 0 
			END as can_view
		FROM posts p
		WHERE can_view = 1
		ORDER BY p.created_at DESC
	`

	rows, err := s.db.Query(query, requestingUserID, requestingUserID, requestingUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var postsWithNicknames []map[string]interface{}
	for rows.Next() {
		post := &model.Post{}
		var canView int

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Content,
			&post.ImagePath,
			&post.Privacy,
			&post.CreatedAt,
			&post.UpdatedAt,
			&canView,
		)
		if err != nil {
			return nil, err
		}

		// Fetch user nickname and avatar directly in the same function
		userQuery := `
			SELECT nickname, avatar 
			FROM users 
			WHERE id = ?
		`

		var nickname, avatar string
		err = s.db.QueryRow(userQuery, post.UserID).Scan(&nickname, &avatar)
		if err != nil {
			if err == sql.ErrNoRows {
				nickname = "Unknown User" // Handle missing user gracefully
				avatar = ""
			} else {
				return nil, err
			}
		}

		// Combine post and user data
		postWithNickname := map[string]interface{}{
			"id":        post.ID,
			"user_id":   post.UserID,
			"nickname":  nickname,
			"avatar":    avatar,
			"content":   post.Content,
			"imagePath": post.ImagePath,
			"privacy":   post.Privacy,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
		}
		postsWithNicknames = append(postsWithNicknames, postWithNickname)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return postsWithNicknames, nil
}
