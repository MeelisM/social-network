package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/internal/auth"
	"social-network/internal/model"
	"social-network/internal/service"
	"time"

	"github.com/google/uuid"
)

type AuthHandler struct {
	AuthService    *service.AuthService
	SessionManager *auth.SessionManager
}

// AuthHandler
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form with max size of 10MB
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// Get user data from form
	var input model.RegisterInput
	userData := r.FormValue("userData")
	if err := json.Unmarshal([]byte(userData), &input); err != nil {
		http.Error(w, "Invalid user data", http.StatusBadRequest)
		return
	}

	// Handle avatar upload if present
	file, header, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()

		// Validate file type
		if !isValidImageType(header.Header.Get("Content-Type")) {
			http.Error(w, "Invalid file type", http.StatusBadRequest)
			return
		}

		// Create uploads directory if it doesn't exist
		uploadDir := "./uploads/avatars"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("%s-%s%s",
			uuid.New().String(),
			time.Now().Format("20060102150405"),
			filepath.Ext(header.Filename),
		)

		fullPath := filepath.Join(uploadDir, filename)
		dst, err := os.Create(fullPath)
		if err != nil {
			http.Error(w, "Failed to create file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			os.Remove(fullPath)
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}

		// Set avatar path in input
		avatarPath := fmt.Sprintf("/uploads/avatars/%s", filename)
		input.Avatar = &avatarPath
	}

	user, err := h.AuthService.Register(input)
	if err != nil {
		// Clean up uploaded file if registration fails
		if input.Avatar != nil {
			os.Remove(filepath.Join(".", *input.Avatar))
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sessionID, err := h.SessionManager.CreateSession(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.AuthService.Login(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	sessionID, err := h.SessionManager.CreateSession(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No active session", http.StatusUnauthorized)
		return
	}

	if _, valid := h.SessionManager.GetSession(cookie.Value); !valid {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	h.SessionManager.DeleteSession(cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(-time.Hour),
	})

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) DebugSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessions := h.SessionManager.GetAllSessions()
	json.NewEncoder(w).Encode(sessions)
}

// VerifySession verifies the session and returns user info
func (h *AuthHandler) VerifySession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No active session", http.StatusUnauthorized)
		return
	}

	session, valid := h.SessionManager.GetSession(cookie.Value)
	if !valid {
		http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"user_id": session.UserID,
	}

	json.NewEncoder(w).Encode(response)
}
