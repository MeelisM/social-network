package service

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"social-network/internal/notification"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ChatService struct {
	db                  *sql.DB
	connections         map[string]*websocket.Conn
	notificationService notification.Service
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

func NewChatService(db *sql.DB, notificationService notification.Service) *ChatService {
	return &ChatService{
		db:                  db,
		connections:         make(map[string]*websocket.Conn),
		notificationService: notificationService,
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

	// Create notification for recipient
	var senderName string
	err = s.db.QueryRow("SELECT first_name FROM users WHERE id = ?", senderID).Scan(&senderName)
	if err == nil {
		err = s.notificationService.CreateNotification(
			recipientID,
			"private_message",
			fmt.Sprintf("New message from %s: %s", senderName, content),
			message.ID,
		)
		if err != nil {
			log.Printf("Failed to create notification: %v", err)
		}
	}

	return nil
}

// Send group message
func (s *ChatService) SendGroupMessage(groupID string, senderID string, content string) error {
	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}
	defer tx.Rollback()

	// Verify sender is a group member
	var status string
	err = tx.QueryRow(`
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

	// Store message within transaction
	_, err = tx.Exec(`
        INSERT INTO group_messages (id, group_id, sender_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)`,
		message.ID, message.GroupID, message.SenderID, message.Content, message.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("error inserting message: %v", err)
	}

	// Get group info and sender name
	var groupTitle, senderName string
	err = tx.QueryRow("SELECT first_name FROM users WHERE id = ?", senderID).Scan(&senderName)
	if err != nil {
		return fmt.Errorf("error getting sender name: %v", err)
	}

	err = tx.QueryRow("SELECT title FROM groups WHERE id = ?", groupID).Scan(&groupTitle)
	if err != nil {
		return fmt.Errorf("error getting group title: %v", err)
	}

	// Get all group members
	rows, err := tx.Query(`
        SELECT user_id FROM group_members 
        WHERE group_id = ? AND status = 'accepted' AND user_id != ?`,
		groupID, senderID)
	if err != nil {
		return fmt.Errorf("error getting group members: %v", err)
	}
	defer rows.Close()

	// Send to all connected members and create notifications
	messageJSON, _ := json.Marshal(message)
	for rows.Next() {
		var memberID string
		if err := rows.Scan(&memberID); err != nil {
			log.Printf("Error scanning member ID: %v", err)
			continue
		}

		// Send WebSocket message if connected
		if conn, ok := s.connections[memberID]; ok {
			if err := conn.WriteMessage(websocket.TextMessage, messageJSON); err != nil {
				log.Printf("Error sending WebSocket message to %s: %v", memberID, err)
			}
		}

		// Create notification within the same transaction
		notificationID := uuid.New().String()
		_, err = tx.Exec(`
            INSERT INTO notifications (id, user_id, type, content, reference_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
			notificationID,
			memberID,
			"group_message",
			fmt.Sprintf("New message from %s in %s: %s", senderName, groupTitle, content),
			message.ID,
			false,
			time.Now(),
		)
		if err != nil {
			log.Printf("Error creating notification for member %s: %v", memberID, err)
		} else {
			log.Printf("Successfully created notification for member %s", memberID)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %v", err)
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

func (s *ChatService) GetUnreadMessageSenders(userID string) ([]string, error) {
	rows, err := s.db.Query(`
        SELECT DISTINCT sender_id
        FROM messages
        WHERE recipient_id = ? AND is_read = FALSE
    `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var senderIDs []string
	for rows.Next() {
		var senderID string
		if err := rows.Scan(&senderID); err != nil {
			return nil, err
		}
		senderIDs = append(senderIDs, senderID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return senderIDs, nil
}
