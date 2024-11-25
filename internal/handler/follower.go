package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/model"
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

func (h *FollowerHandler) RespondToFollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.FollowResponse
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := h.FollowerService.RespondToRequest(input.RequestID, userID, input.Accept); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *FollowerHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if user_id is provided in the URL query parameters
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		// Fallback to context if user_id is not provided in the query
		ctxUserID, ok := r.Context().Value("user_id").(string)
		if !ok || ctxUserID == "" {
			http.Error(w, "User ID not found", http.StatusBadRequest)
			return
		}
		userID = ctxUserID
	}

	// Fetch followers
	followers, err := h.FollowerService.GetFollowers(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return followers as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(followers)
}

func (h *FollowerHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if user_id is provided in the URL query parameters
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		// Fallback to context if user_id is not provided in the query
		ctxUserID, ok := r.Context().Value("user_id").(string)
		if !ok || ctxUserID == "" {
			http.Error(w, "User ID not found", http.StatusBadRequest)
			return
		}
		userID = ctxUserID
	}

	// Fetch following
	following, err := h.FollowerService.GetFollowing(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return following as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(following)
}

func (h *FollowerHandler) GetPendingRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	requests, err := h.FollowerService.GetPendingRequests(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(requests)
}

func (h *FollowerHandler) GetFollowStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID := r.Context().Value("user_id").(string)
	otherUserID := r.URL.Query().Get("user_id")

	if otherUserID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	var status string
	err := h.FollowerService.GetFollowStatus(currentUserID, otherUserID, &status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": status})
}

func (h *FollowerHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
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
	if err := h.FollowerService.Unfollow(userID, input.UserID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
