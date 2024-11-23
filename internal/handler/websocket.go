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
}

func NewWebSocketHandler(notificationService *service.NotificationService) *WebSocketHandler {
	return &WebSocketHandler{
		notificationService: notificationService,
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

	// Register connection
	h.notificationService.RegisterConnection(userID, conn)
	defer h.notificationService.RemoveConnection(userID)

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
			notifications, err := h.notificationService.GetUserNotifications(userID)
			if err != nil {
				log.Printf("Error getting notifications: %v", err)
				continue
			}
			response := map[string]interface{}{
				"type":    "notifications",
				"content": notifications,
			}
			conn.WriteJSON(response)

		case "mark_read":
			if notifID, ok := msg["notification_id"].(string); ok {
				h.notificationService.MarkAsRead(notifID, userID)
			}
		}
	}

	log.Printf("Client disconnected: %s", userID)
}
