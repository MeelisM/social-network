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

	// Fetch comments for the post
	comments, err := s.getPostComments(post.ID)
	if err != nil {
		return nil, err
	}
	post.Comments = comments

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

	// Delete comments first (if using ON DELETE CASCADE, this isn't necessary)
	_, err = tx.Exec(`DELETE FROM post_comments WHERE post_id = ?`, postID)
	if err != nil {
		return err
	}

	// Delete post viewers
	_, err = tx.Exec(`DELETE FROM post_viewers WHERE post_id = ?`, postID)
	if err != nil {
		return err
	}

	// Delete the post
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

	var postsWithUserInfo []map[string]interface{}
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

		// Fetch user information
		userQuery := `
            SELECT first_name, last_name, COALESCE(avatar, '') as avatar
            FROM users
            WHERE id = ?
        `
		var firstName, lastName, avatar sql.NullString
		err = s.db.QueryRow(userQuery, post.UserID).Scan(&firstName, &lastName, &avatar)
		if err != nil {
			if err == sql.ErrNoRows {
				firstName = sql.NullString{String: "Unknown", Valid: true}
				lastName = sql.NullString{String: "User", Valid: true}
				avatar = sql.NullString{String: "", Valid: true}
			} else {
				return nil, err
			}
		}

		// Get the actual string values, using defaults for NULL values
		firstNameStr := "Unknown"
		if firstName.Valid {
			firstNameStr = firstName.String
		}

		lastNameStr := "User"
		if lastName.Valid {
			lastNameStr = lastName.String
		}

		avatarStr := ""
		if avatar.Valid {
			avatarStr = avatar.String
		}

		// Fetch comments
		comments, err := s.getPostComments(post.ID)
		if err != nil {
			return nil, err
		}

		// Combine post and user data
		postWithUser := map[string]interface{}{
			"id":         post.ID,
			"user_id":    post.UserID,
			"first_Name": firstNameStr,
			"last_Name":  lastNameStr,
			"avatar":     avatarStr,
			"content":    post.Content,
			"imagePath":  post.ImagePath,
			"privacy":    post.Privacy,
			"createdAt":  post.CreatedAt,
			"updatedAt":  post.UpdatedAt,
			"comments":   comments,
		}
		postsWithUserInfo = append(postsWithUserInfo, postWithUser)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return postsWithUserInfo, nil
}

func (s *PostService) CreateComment(postID string, userID string, content string) (*model.PostComment, error) {
	// First verify the post exists and user can view it
	_, err := s.GetPost(postID, userID)
	if err != nil {
		return nil, err
	}

	comment := &model.PostComment{
		ID:        uuid.New().String(),
		PostID:    postID,
		UserID:    userID,
		Content:   content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = s.db.Exec(`
        INSERT INTO post_comments (id, post_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
		comment.ID, comment.PostID, comment.UserID,
		comment.Content, comment.CreatedAt, comment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Fetch user info for the response
	err = s.db.QueryRow(`
        SELECT nickname, avatar FROM users WHERE id = ?`,
		userID,
	).Scan(&comment.UserNickname, &comment.UserAvatar)
	if err != nil {
		// Don't fail if we can't get user info, just continue
		comment.UserNickname = "Unknown User"
	}

	return comment, nil
}

func (s *PostService) GetPostComments(postID string, requestingUserID string) ([]model.PostComment, error) {
	// First verify the post exists and user can view it
	_, err := s.GetPost(postID, requestingUserID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(`
        SELECT pc.id, pc.post_id, pc.user_id, pc.content, pc.created_at, pc.updated_at,
               u.nickname, u.avatar
        FROM post_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.post_id = ?
        ORDER BY pc.created_at ASC`,
		postID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []model.PostComment
	for rows.Next() {
		var comment model.PostComment
		err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.UpdatedAt,
			&comment.UserNickname,
			&comment.UserAvatar,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	return comments, nil
}

func (s *PostService) DeleteComment(commentID string, userID string) error {
	// Verify the comment exists and belongs to the user
	var commentUserID string
	err := s.db.QueryRow(`
        SELECT user_id FROM post_comments WHERE id = ?`,
		commentID,
	).Scan(&commentUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("comment not found")
		}
		return err
	}

	if commentUserID != userID {
		return errors.New("unauthorized to delete this comment")
	}

	_, err = s.db.Exec(`DELETE FROM post_comments WHERE id = ?`, commentID)
	return err
}

func (s *PostService) getPostComments(postID string) ([]model.PostComment, error) {
	rows, err := s.db.Query(`
        SELECT pc.id, pc.post_id, pc.user_id, pc.content, pc.created_at, pc.updated_at,
               u.nickname, u.avatar
        FROM post_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.post_id = ?
        ORDER BY pc.created_at ASC`,
		postID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []model.PostComment
	for rows.Next() {
		var comment model.PostComment
		var nickname, avatar sql.NullString
		err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.UpdatedAt,
			&nickname,
			&avatar,
		)
		if err != nil {
			return nil, err
		}

		comment.UserNickname = nickname.String
		if !nickname.Valid {
			comment.UserNickname = "Unknown User"
		}
		comment.UserAvatar = avatar.String

		comments = append(comments, comment)
	}

	return comments, nil
}

func (s *PostService) GetUserPosts(userID string) ([]map[string]interface{}, error) {
	// Query to fetch posts by the user
	query := `
        SELECT p.*, u.nickname, u.avatar
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userPosts []map[string]interface{}
	for rows.Next() {
		post := &model.Post{}
		var nickname, avatar sql.NullString

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Content,
			&post.ImagePath,
			&post.Privacy,
			&post.CreatedAt,
			&post.UpdatedAt,
			&nickname,
			&avatar,
		)
		if err != nil {
			return nil, err
		}

		// Fetch comments for the post
		comments, err := s.getPostComments(post.ID)
		if err != nil {
			return nil, err
		}

		// Combine post and user data
		postWithDetails := map[string]interface{}{
			"id":        post.ID,
			"user_id":   post.UserID,
			"nickname":  nickname.String,
			"avatar":    avatar.String,
			"content":   post.Content,
			"imagePath": post.ImagePath,
			"privacy":   post.Privacy,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"comments":  comments,
		}
		userPosts = append(userPosts, postWithDetails)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return userPosts, nil
}
