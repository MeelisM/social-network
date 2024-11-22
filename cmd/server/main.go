package main

import (
	"log"
	"net/http"
	"social-network/internal/auth"
	"social-network/internal/handler"
	"social-network/internal/middleware"
	"social-network/internal/service"
	"social-network/pkg/db/sqlite"
)

func main() {
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
	userService := service.NewUserService(db.DB)

	// Initialize handlers
	authHandler := &handler.AuthHandler{
		AuthService:    authService,
		SessionManager: sessionManager,
	}
	postHandler := &handler.PostHandler{
		PostService: postService,
	}
	followerHandler := &handler.FollowerHandler{
		FollowerService: followerService,
	}
	userHandler := &handler.UserHandler{
		UserService: userService,
	}
	webSocketHandler := handler.NewWebSocketHandler()

	// Setup routes
	router := http.NewServeMux()
	router.HandleFunc("/register", authHandler.Register)
	router.HandleFunc("/login", authHandler.Login)
	router.HandleFunc("/logout", authMiddleware.RequireAuth(authHandler.Logout))
	router.HandleFunc("/auth", authHandler.VerifySession)

	// Post routes
	router.HandleFunc("/posts", authMiddleware.RequireAuth(postHandler.CreatePost))
	router.HandleFunc("/posts/", authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			postHandler.GetPost(w, r)
		case http.MethodPut:
			postHandler.UpdatePost(w, r)
		case http.MethodDelete:
			postHandler.DeletePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Follower routes
	router.HandleFunc("/follow", authMiddleware.RequireAuth(followerHandler.Follow))
	router.HandleFunc("/follow/respond", authMiddleware.RequireAuth(followerHandler.RespondToFollow))
	router.HandleFunc("/followers", authMiddleware.RequireAuth(followerHandler.GetFollowers))
	router.HandleFunc("/following", authMiddleware.RequireAuth(followerHandler.GetFollowing))
	router.HandleFunc("/follow/pending", authMiddleware.RequireAuth(followerHandler.GetPendingRequests))
	router.HandleFunc("/follow/status", authMiddleware.RequireAuth(followerHandler.GetFollowStatus))

	// User routes
	router.HandleFunc("/users", userHandler.GetAllUsers)

	// WebSocket route
	router.HandleFunc("/ws", webSocketHandler.HandleConnections)

	// Start server
	log.Printf("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORS(router)))
}
