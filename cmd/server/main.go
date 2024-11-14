package main

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/internal/auth"
	"social-network/internal/middleware"
	"social-network/internal/model"
	"social-network/internal/service"
	"social-network/pkg/db/sqlite"
	"time"
)

type Server struct {
	router         *http.ServeMux
	authService    *service.AuthService
	sessionManager *auth.SessionManager
	authMiddleware *middleware.AuthMiddleware
}

func NewServer() *Server {

	dbPath := "./data/social_network.db"
	migrationsPath := "./pkg/db/migrations/sqlite"
	// Initialize database
	db, err := sqlite.New(dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// Run migrations
	if err := db.RunMigrations(migrationsPath); err != nil {
		log.Fatal(err)
	}

	// Initialize services and middleware
	sessionManager := auth.NewSessionManager()
	authService := service.NewAuthService(db.DB)
	authMiddleware := middleware.NewAuthMiddleware(sessionManager)

	server := &Server{
		router:         http.NewServeMux(),
		authService:    authService,
		sessionManager: sessionManager,
		authMiddleware: authMiddleware,
	}

	server.routes()
	return server
}

func (s *Server) routes() {
	s.router.HandleFunc("/register", s.handleRegister)
	s.router.HandleFunc("/login", s.handleLogin)
	s.router.HandleFunc("/logout", s.authMiddleware.RequireAuth(s.handleLogout))
	s.router.HandleFunc("/debug/sessions", s.handleDebugSessions)
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := s.authService.Register(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sessionID, err := s.sessionManager.CreateSession(user)
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

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := s.authService.Login(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	sessionID, err := s.sessionManager.CreateSession(user)
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

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No active session", http.StatusUnauthorized)
		return
	}

	if _, valid := s.sessionManager.GetSession(cookie.Value); !valid {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	s.sessionManager.DeleteSession(cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(-time.Hour),
	})

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleDebugSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessions := s.sessionManager.GetAllSessions()
	json.NewEncoder(w).Encode(sessions)
}

func main() {
	server := NewServer()
	log.Printf("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", server.router))
}
