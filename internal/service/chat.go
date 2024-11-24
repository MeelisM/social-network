package service

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ChatService struct {
	db          *sql.DB
	connections map[string]*websocket.Conn
}

type Message struct {
	ID          string    `json:"id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id,omitempty"`
	GroupID     string    `json:"group_id,omitempty"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	IsRead      bool      `json:"is_read,omitempty"`
	Type        string    `json:"type"` // "private" or "group"
}

func NewChatService(db *sql.DB) *ChatService {
	return &ChatService{
		db:          db,
		connections: make(map[string]*websocket.Conn),
	}
}

// Send private message
func (s *ChatService) SendPrivateMessage(senderID, recipientID, content string) error {
	message := Message{
		ID:          uuid.New().String(),
		SenderID:    senderID,
		RecipientID: recipientID,
		Content:     content,
		CreatedAt:   time.Now(),
		IsRead:      false,
		Type:        "private",
	}

	_, err := s.db.Exec(`
        INSERT INTO messages (id, sender_id, recipient_id, content, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?)`,
		message.ID, message.SenderID, message.RecipientID, message.Content,
		message.CreatedAt, message.IsRead,
	)
	if err != nil {
		return err
	}

	// Send real-time if recipient is connected
	if conn, ok := s.connections[recipientID]; ok {
		messageJSON, _ := json.Marshal(message)
		conn.WriteMessage(websocket.TextMessage, messageJSON)
	}

	return nil
}

// Send group message
func (s *ChatService) SendGroupMessage(groupID string, senderID string, content string) error {
	// Verify sender is a group member
	var status string
	err := s.db.QueryRow(`
        SELECT status FROM group_members 
        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`,
		groupID, senderID).Scan(&status)
	if err != nil {
		return err
	}

	message := Message{
		ID:        uuid.New().String(),
		SenderID:  senderID,
		GroupID:   groupID,
		Content:   content,
		CreatedAt: time.Now(),
		Type:      "group",
	}

	// Store message
	_, err = s.db.Exec(`
        INSERT INTO group_messages (id, group_id, sender_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)`,
		message.ID, message.GroupID, message.SenderID, message.Content, message.CreatedAt,
	)
	if err != nil {
		return err
	}

	// Get all group members
	rows, err := s.db.Query(`
        SELECT user_id FROM group_members 
        WHERE group_id = ? AND status = 'accepted'`,
		groupID)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Send to all connected members
	messageJSON, _ := json.Marshal(message)
	for rows.Next() {
		var memberID string
		if err := rows.Scan(&memberID); err != nil {
			continue
		}
		if conn, ok := s.connections[memberID]; ok {
			conn.WriteMessage(websocket.TextMessage, messageJSON)
		}
	}

	return nil
}

// Get private chat history
func (s *ChatService) GetPrivateMessageHistory(userID1, userID2 string) (map[string][]Message, error) {
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

	sentMessages := []Message{}
	receivedMessages := []Message{}

	for rows.Next() {
		var msg Message
		msg.Type = "private"
		err := rows.Scan(
			&msg.ID, &msg.SenderID, &msg.RecipientID,
			&msg.Content, &msg.CreatedAt, &msg.IsRead,
		)
		if err != nil {
			return nil, err
		}

		if msg.SenderID == userID1 {
			sentMessages = append(sentMessages, msg)
		} else {
			receivedMessages = append(receivedMessages, msg)
		}
	}

	return map[string][]Message{
		"sent":     sentMessages,
		"received": receivedMessages,
	}, nil
}

// Get group chat history
func (s *ChatService) GetGroupMessageHistory(groupID, userID string) ([]Message, error) {
	// Verify user is group member
	var status string
	err := s.db.QueryRow(`
        SELECT status FROM group_members 
        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`,
		groupID, userID).Scan(&status)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(`
        SELECT id, sender_id, content, created_at
        FROM group_messages
        WHERE group_id = ?
        ORDER BY created_at ASC`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		msg.Type = "group"
		msg.GroupID = groupID
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.Content, &msg.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// Mark private messages as read
func (s *ChatService) MarkMessagesAsRead(senderID, recipientID string) error {
	_, err := s.db.Exec(`
        UPDATE messages
        SET is_read = TRUE
        WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE`,
		senderID, recipientID,
	)
	return err
}

// Connection management
func (s *ChatService) RegisterConnection(userID string, conn *websocket.Conn) {
	s.connections[userID] = conn
}

func (s *ChatService) RemoveConnection(userID string) {
	delete(s.connections, userID)
}
