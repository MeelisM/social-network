package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/service"
)

type FollowerHandler struct {
	FollowerService *service.FollowerService
}

func (h *FollowerHandler) Follow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	request, err := h.FollowerService.SendFollowRequest(userID, input.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(request)
}
