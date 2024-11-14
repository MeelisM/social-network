package middleware

import (
	"context"
	"net/http"
	"social-network/internal/auth"
)

type AuthMiddleware struct {
	sessionManager *auth.SessionManager
}

func NewAuthMiddleware(sm *auth.SessionManager) *AuthMiddleware {
	return &AuthMiddleware{sessionManager: sm}
}

func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		cookie, err := r.Cookie("session_id")
		if err != nil {
			http.Error(w, "No session cookie found", http.StatusUnauthorized)
			return
		}

		session, valid := m.sessionManager.GetSession(cookie.Value)
		if !valid {
			http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user_id", session.UserID)
		next(w, r.WithContext(ctx))
	}
}
