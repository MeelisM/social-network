package service

import (
	"database/sql"
	"errors"
	"social-network/internal/model"
	"time"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetAllUsers() ([]model.User, error) {
	query := `SELECT id, COALESCE(first_name, ''), COALESCE(last_name, '') FROM users`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		var firstName, lastName string
		// Scan user ID, first name, and last name
		err := rows.Scan(&user.ID, &firstName, &lastName)
		if err != nil {
			return nil, err
		}
		// Combine first and last names into a single username field
		user.FirstName = firstName
		user.LastName = lastName
		users = append(users, user)
	}

	return users, nil
}

func (s *UserService) GetUserByUUID(uuid string) (*model.User, error) {
	query := `
        SELECT id, email, first_name, last_name, date_of_birth, 
               avatar, nickname, about_me, is_public, created_at, updated_at
        FROM users
        WHERE id = ?`

	var user model.User
	err := s.db.QueryRow(query, uuid).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Nickname,
		&user.AboutMe,
		&user.IsPublic,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateProfileVisibility(userID string, isPublic bool) error {
	_, err := s.db.Exec(`
        UPDATE users 
        SET is_public = ?, 
            updated_at = ?
        WHERE id = ?`,
		isPublic,
		time.Now(),
		userID,
	)
	return err
}

func (s *UserService) GetProfileVisibility(userID string) (bool, error) {
	var isPublic bool
	err := s.db.QueryRow(`
        SELECT is_public 
        FROM users 
        WHERE id = ?`,
		userID,
	).Scan(&isPublic)

	if err != nil {
		return false, err
	}

	return isPublic, nil
}
