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
	chatService         *service.ChatService
}

func NewWebSocketHandler(notificationService *service.NotificationService, chatService *service.ChatService) *WebSocketHandler {
	return &WebSocketHandler{
		notificationService: notificationService,
		chatService:         chatService,
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
	h.chatService.RegisterConnection(userID, conn)
	defer h.notificationService.RemoveConnection(userID)
	defer h.chatService.RemoveConnection(userID)

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
		case "send_private_message":
			h.handlePrivateMessage(conn, userID, msg)
		case "send_group_message":
			h.handleGroupMessage(conn, userID, msg)
		case "get_private_history":
			h.handleGetPrivateHistory(conn, userID, msg)
		case "get_group_history":
			h.handleGetGroupHistory(conn, userID, msg)
		case "mark_messages_read":
			h.handleMarkMessagesRead(conn, userID, msg)
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

func (h *WebSocketHandler) handlePrivateMessage(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	recipientID, ok := msg["recipient_id"].(string)
	content, okContent := msg["content"].(string)
	if !ok || !okContent {
		log.Println("Invalid private message payload")
		return
	}

	err := h.chatService.SendPrivateMessage(userID, recipientID, content)
	if err != nil {
		log.Printf("Error sending private message: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "message_sent",
		"success": true,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleGroupMessage(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	groupID, ok := msg["group_id"].(string)
	content, okContent := msg["content"].(string)
	if !ok || !okContent {
		log.Println("Invalid group message payload")
		return
	}

	err := h.chatService.SendGroupMessage(groupID, userID, content)
	if err != nil {
		log.Printf("Error sending group message: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "message_sent",
		"success": true,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleGetPrivateHistory(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	otherUserID, ok := msg["other_user_id"].(string)
	if !ok {
		log.Println("Invalid user ID for message history")
		return
	}

	messages, err := h.chatService.GetPrivateMessageHistory(userID, otherUserID)
	if err != nil {
		log.Printf("Error fetching private message history: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "private_message_history",
		"content": messages,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleGetGroupHistory(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	groupID, ok := msg["group_id"].(string)
	if !ok {
		log.Println("Invalid group ID for message history")
		return
	}

	messages, err := h.chatService.GetGroupMessageHistory(groupID, userID)
	if err != nil {
		log.Printf("Error fetching group message history: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "group_message_history",
		"content": messages,
	}
	conn.WriteJSON(response)
}

func (h *WebSocketHandler) handleMarkMessagesRead(conn *websocket.Conn, userID string, msg map[string]interface{}) {
	senderID, ok := msg["sender_id"].(string)
	if !ok {
		log.Println("Invalid sender ID for marking messages read")
		return
	}

	err := h.chatService.MarkMessagesAsRead(senderID, userID)
	if err != nil {
		log.Printf("Error marking messages as read: %v", err)
		return
	}

	response := map[string]interface{}{
		"type":    "messages_marked_read",
		"success": true,
	}
	conn.WriteJSON(response)
}
