package service

import (
	"database/sql"
	"errors"
	"social-network/internal/model"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetAllUsers() ([]model.User, error) {
	query := `SELECT id, nickname FROM users WHERE is_public = 1`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(&user.ID, &user.Nickname)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func (s *UserService) GetUserByUUID(uuid string) (*model.User, error) {
	query := `
        SELECT id, nickname, avatar, about_me, is_public, created_at
        FROM users
        WHERE id = ?`

	var user model.User
	err := s.db.QueryRow(query, uuid).Scan(
		&user.ID, &user.Nickname, &user.Avatar, &user.AboutMe, &user.IsPublic, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}
