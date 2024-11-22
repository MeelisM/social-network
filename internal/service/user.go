package service

import (
	"database/sql"
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
		err := rows.Scan(
			&user.ID, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// placeholder if needed

// func (s *UserService) GetUserByID(userID string) (*model.User, error) {
// 	var user model.User
// 	err := s.db.QueryRow(`
//         SELECT id, first_name, last_name FROM users WHERE id = ?`,
// 		userID).Scan(&user.ID, &user.FirstName, &user.LastName)

// 	if err != nil {
// 		if err == sql.ErrNoRows {
// 			return nil, errors.New("user not found")
// 		}
// 		return nil, err
// 	}

// 	return &user, nil
// }
