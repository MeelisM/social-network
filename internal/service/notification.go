package service

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type NotificationService struct {
	db          *sql.DB
	connections map[string]*websocket.Conn
}

func NewNotificationService(db *sql.DB) *NotificationService {
	return &NotificationService{
		db:          db,
		connections: make(map[string]*websocket.Conn),
	}
}

func (s *NotificationService) CreateNotification(userID string, notificationType string, content string, referenceID string) error {
	notification := struct {
		ID          string    `json:"id"`
		UserID      string    `json:"user_id"`
		Type        string    `json:"type"`
		Content     string    `json:"content"`
		ReferenceID string    `json:"reference_id"`
		IsRead      bool      `json:"is_read"`
		CreatedAt   time.Time `json:"created_at"`
	}{
		ID:          uuid.New().String(),
		UserID:      userID,
		Type:        notificationType,
		Content:     content,
		ReferenceID: referenceID,
		IsRead:      false,
		CreatedAt:   time.Now(),
	}

	_, err := s.db.Exec(`
        INSERT INTO notifications (id, user_id, type, content, reference_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
		notification.ID,
		notification.UserID,
		notification.Type,
		notification.Content,
		notification.ReferenceID,
		notification.IsRead,
		notification.CreatedAt,
	)
	if err != nil {
		return err
	}

	// Send real-time notification if user is connected
	if conn, ok := s.connections[userID]; ok {
		notificationJson, _ := json.Marshal(notification)
		conn.WriteMessage(websocket.TextMessage, notificationJson)
	}

	return nil
}

func (s *NotificationService) GetUserNotifications(userID string) ([]map[string]interface{}, error) {
	rows, err := s.db.Query(`
        SELECT n.id, n.type, n.content, n.reference_id, n.is_read, n.created_at,
               COALESCE(gm.status, 'unknown') as invitation_status
        FROM notifications n
        LEFT JOIN group_members gm ON n.reference_id = gm.group_id AND gm.user_id = n.user_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []map[string]interface{}
	for rows.Next() {
		var id, notificationType, content, referenceID, invitationStatus string
		var isRead bool
		var createdAt time.Time

		err := rows.Scan(&id, &notificationType, &content, &referenceID, &isRead, &createdAt, &invitationStatus)
		if err != nil {
			return nil, err
		}

		notification := map[string]interface{}{
			"id":           id,
			"type":         notificationType,
			"content":      content,
			"reference_id": referenceID,
			"is_read":      isRead,
			"created_at":   createdAt,
		}

		if notificationType == "group_invite" {
			notification["invitation_status"] = invitationStatus
		}

		notifications = append(notifications, notification)
	}

	return notifications, nil
}

func (s *NotificationService) MarkAsRead(notificationID string, userID string) error {
	_, err := s.db.Exec(`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = ? AND user_id = ?`,
		notificationID, userID)
	return err
}

func (s *NotificationService) RegisterConnection(userID string, conn *websocket.Conn) {
	s.connections[userID] = conn
}

func (s *NotificationService) RemoveConnection(userID string) {
	delete(s.connections, userID)
}
