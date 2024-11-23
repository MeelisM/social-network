package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/service"
)

type MessageHandler struct {
	MessageService *service.MessageService
}

func NewMessageHandler(messageService *service.MessageService) *MessageHandler {
	return &MessageHandler{
		MessageService: messageService,
	}
}

// Retrieve message history
func (h *MessageHandler) GetMessageHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	peerID := r.URL.Query().Get("peer_id")

	messages, err := h.MessageService.GetMessageHistory(userID, peerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(messages)
}

// Send a message (alternative to WebSocket-based messaging)
func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		RecipientID string `json:"recipient_id"`
		Content     string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)

	if err := h.MessageService.SendMessage(userID, input.RecipientID, input.Content); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
