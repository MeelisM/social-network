package service

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type MessageService struct {
	db          *sql.DB
	connections map[string]*websocket.Conn
}

func NewMessageService(db *sql.DB) *MessageService {
	return &MessageService{
		db:          db,
		connections: make(map[string]*websocket.Conn),
	}
}

// Send a message via WebSocket or fallback to storing it
func (s *MessageService) SendMessage(senderID, recipientID, content string) error {
	message := struct {
		ID          string    `json:"id"`
		SenderID    string    `json:"sender_id"`
		RecipientID string    `json:"recipient_id"`
		Content     string    `json:"content"`
		CreatedAt   time.Time `json:"created_at"`
		IsRead      bool      `json:"is_read"`
	}{
		ID:          uuid.New().String(),
		SenderID:    senderID,
		RecipientID: recipientID,
		Content:     content,
		CreatedAt:   time.Now(),
		IsRead:      false,
	}

	_, err := s.db.Exec(`
        INSERT INTO messages (id, sender_id, recipient_id, content, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?)`,
		message.ID, message.SenderID, message.RecipientID, message.Content, message.CreatedAt, message.IsRead,
	)
	if err != nil {
		return err
	}

	if conn, ok := s.connections[recipientID]; ok {
		messageJSON, _ := json.Marshal(message)
		conn.WriteMessage(websocket.TextMessage, messageJSON)
	}

	return nil
}

// Retrieve message history between two users
func (s *MessageService) GetMessageHistory(userID1, userID2 string) ([]map[string]interface{}, error) {
	rows, err := s.db.Query(`
        SELECT id, sender_id, recipient_id, content, created_at, is_read
        FROM messages
        WHERE (sender_id = ? AND recipient_id = ?)
           OR (sender_id = ? AND recipient_id = ?)
        ORDER BY created_at ASC`,
		userID1, userID2, userID2, userID1,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []map[string]interface{}
	for rows.Next() {
		var id, senderID, recipientID, content string
		var createdAt time.Time
		var isRead bool

		err := rows.Scan(&id, &senderID, &recipientID, &content, &createdAt, &isRead)
		if err != nil {
			return nil, err
		}

		message := map[string]interface{}{
			"id":           id,
			"sender_id":    senderID,
			"recipient_id": recipientID,
			"content":      content,
			"created_at":   createdAt,
			"is_read":      isRead,
		}
		messages = append(messages, message)
	}

	return messages, nil
}

// Mark messages as read
func (s *MessageService) MarkMessagesAsRead(senderID, recipientID string) error {
	_, err := s.db.Exec(`
        UPDATE messages
        SET is_read = TRUE
        WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE`,
		senderID, recipientID,
	)
	return err
}

// Register WebSocket connection
func (s *MessageService) RegisterConnection(userID string, conn *websocket.Conn) {
	s.connections[userID] = conn
}

// Remove WebSocket connection
func (s *MessageService) RemoveConnection(userID string) {
	delete(s.connections, userID)
}
