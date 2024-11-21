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

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
