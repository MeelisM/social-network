package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/service"
)

type UserHandler struct {
	UserService *service.UserService
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := h.UserService.GetAllUsers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) GetUserByUUID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	uuid := r.URL.Path[len("/users/"):]
	if uuid == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	user, err := h.UserService.GetUserByUUID(uuid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(user)
}
