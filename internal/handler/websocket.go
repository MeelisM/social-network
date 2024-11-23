package handler

import (
	"log"
	"net/http"
	"social-network/internal/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WebSocketHandler struct {
	notificationService *service.NotificationService
	messageService      *service.MessageService
}

func NewWebSocketHandler(notificationService *service.NotificationService, messageService *service.MessageService) *WebSocketHandler {
	return &WebSocketHandler{
		notificationService: notificationService,
		messageService:      messageService,
	}
}

func (h *WebSocketHandler) HandleConnections(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	// Get userID from context (set by auth middleware)
	userID := r.Context().Value("user_id").(string)

	// Register connection for notifications and messages
	h.notificationService.RegisterConnection(userID, conn)
	h.messageService.RegisterConnection(userID, conn)
	defer h.notificationService.RemoveConnection(userID)
	defer h.messageService.RemoveConnection(userID)

	log.Printf("Client connected: %s", userID)

	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		// Handle different message types
		switch msg["type"] {
		case "get_notifications":
			h.handleNotifications(conn, userID)
		case "mark_read":
			if notifID, ok := msg["notification_id"].(string); ok {
				h.notificationService.MarkAsRead(notifID, userID)
			}
		case "send_message":
			h.handleSendMessage(conn, userID, msg)
		case "get_message_history":
			if chatID, ok := msg["chat_id"].(string); ok {
				h.handleGetMessageHistory(conn, userID, chatID)
			}
		default:
			log.Printf("Unknown message type: %v", msg["type"])
		}
	}

	log.Printf("Client disconnected: %s", userID)
}

func (h *WebSocketHandler) handleNotifications(conn *websocket.Conn, userID string) {
	notifications, err := h.notificationService.GetUserNotifications(userID)
	if err != nil {
		log.Printf("Error getting notifications: %v", err)
		return
	}
	response := map[string]interface{}{
		"type":    "notifications",
		"content": notifications,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleSendMessage(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	recipientID, ok := msg["recipient_id"].(string)
	content, okContent := msg["content"].(string)
	if !ok || !okContent {
		log.Println("Invalid message payload")
		return
	}

	err := h.messageService.SendMessage(userID, recipientID, content)
	if err != nil {
		log.Printf("Error sending message: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "message_sent",
		"success": true,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleGetMessageHistory(conn *websocket.Conn, userID string, chatID string) {
	messages, err := h.messageService.GetMessageHistory(userID, chatID)
	if err != nil {
		log.Printf("Error fetching message history: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "message_history",
		"content": messages,
	}
	conn.WriteJSON(response)
}
