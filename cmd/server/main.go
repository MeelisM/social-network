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
	router          *http.ServeMux
	authService     *service.AuthService
	sessionManager  *auth.SessionManager
	authMiddleware  *middleware.AuthMiddleware
	postService     *service.PostService
	followerService *service.FollowerService
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
	postService := service.NewPostService(db.DB)
	followerService := service.NewFollowerService(db.DB)

	server := &Server{
		router:          http.NewServeMux(),
		authService:     authService,
		sessionManager:  sessionManager,
		authMiddleware:  authMiddleware,
		postService:     postService,
		followerService: followerService,
	}

	server.routes()
	return server
}

func (s *Server) routes() {
	s.router.HandleFunc("/register", s.handleRegister)
	s.router.HandleFunc("/login", s.handleLogin)
	s.router.HandleFunc("/logout", s.authMiddleware.RequireAuth(s.handleLogout))
	s.router.HandleFunc("/debug/sessions", s.handleDebugSessions)
	s.router.HandleFunc("/posts", s.authMiddleware.RequireAuth(s.handleCreatePost))
	s.router.HandleFunc("/posts/", s.authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.handleGetPost(w, r)
		case http.MethodPut:
			s.handleUpdatePost(w, r)
		case http.MethodDelete:
			s.handleDeletePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	s.router.HandleFunc("/follow", s.authMiddleware.RequireAuth(s.handleFollow))
	s.router.HandleFunc("/follow/respond", s.authMiddleware.RequireAuth(s.handleFollowResponse))
	s.router.HandleFunc("/followers", s.authMiddleware.RequireAuth(s.handleGetFollowers))
	s.router.HandleFunc("/following", s.authMiddleware.RequireAuth(s.handleGetFollowing))
	s.router.HandleFunc("/follow/pending", s.authMiddleware.RequireAuth(s.handleGetPendingRequests))
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

func (s *Server) handleCreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input model.CreatePostInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	post, err := s.postService.CreatePost(userID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func (s *Server) handleGetPost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Path[len("/posts/"):]
	if postID == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	post, err := s.postService.GetPost(postID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(post)
}

func (s *Server) handleUpdatePost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Path[len("/posts/"):]
	if postID == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	var input model.UpdatePostInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	post, err := s.postService.UpdatePost(postID, userID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(post)
}

func (s *Server) handleDeletePost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Path[len("/posts/"):]
	if postID == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := s.postService.DeletePost(postID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
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

func (s *Server) handleFollow(w http.ResponseWriter, r *http.Request) {
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
	request, err := s.followerService.SendFollowRequest(userID, input.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(request)
}

func (s *Server) handleFollowResponse(w http.ResponseWriter, r *http.Request) {
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
	if err := s.followerService.RespondToRequest(input.RequestID, userID, input.Accept); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleGetFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	followers, err := s.followerService.GetFollowers(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(followers)
}

func (s *Server) handleGetFollowing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	following, err := s.followerService.GetFollowing(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(following)
}

func (s *Server) handleGetPendingRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("user_id").(string)
	requests, err := s.followerService.GetPendingRequests(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(requests)
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

	corsWrappedRouter := middleware.CORS(server.router)

	log.Printf("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsWrappedRouter))
}
