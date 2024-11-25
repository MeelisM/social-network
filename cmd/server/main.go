package main

import (
	"flag"
	"log"
	"net/http"
	"social-network/internal/auth"
	"social-network/internal/handler"
	"social-network/internal/middleware"
	"social-network/internal/service"
	"social-network/pkg/db/sqlite"
	"strings"
)

func main() {
	migrateDown := flag.Bool("down", false, "Run down migrations")
	steps := flag.Int("steps", 0, "Number of migration steps (positive for up, negative for down)")
	flag.Parse()

	dbPath := "./data/social_network.db"
	migrationsPath := "./pkg/db/migrations/sqlite"

	// Initialize database
	db, err := sqlite.New(dbPath)
	if err != nil {
		log.Fatal(err)
	}

	if *migrateDown {
		log.Println("Running down migrations...")
		if err := db.DownMigrations(migrationsPath); err != nil {
			log.Fatal(err)
		}
		log.Println("Successfully ran down migrations")
		return
	}

	if *steps != 0 {
		log.Printf("Stepping migrations: %d\n", *steps)
		if err := db.StepMigrations(migrationsPath, *steps); err != nil {
			log.Fatal(err)
		}
		log.Printf("Successfully stepped migrations: %d\n", *steps)
		return
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
	userService := service.NewUserService(db.DB)
	notificationService := service.NewNotificationService(db.DB)
	chatService := service.NewChatService(db.DB, notificationService)
	followerService := service.NewFollowerService(db.DB, notificationService)
	groupService := service.NewGroupService(db.DB, notificationService)
	webSocketHandler := handler.NewWebSocketHandler(notificationService, chatService)
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
	groupHandler := &handler.GroupHandler{
		GroupService: groupService,
	}
	notificationHandler := &handler.NotificationHandler{
		NotificationService: notificationService,
	}
	chatHandler := &handler.ChatHandler{
		ChatService: chatService,
	}

	// Setup routes
	router := http.NewServeMux()
	router.HandleFunc("/register", authHandler.Register)
	router.HandleFunc("/login", authHandler.Login)
	router.HandleFunc("/logout", authMiddleware.RequireAuth(authHandler.Logout))
	router.HandleFunc("/auth", authHandler.VerifySession)

	// Post routes
	router.HandleFunc("/posts", authMiddleware.RequireAuth(postHandler.CreatePost))
	router.HandleFunc("/posts/public", authMiddleware.RequireAuth(postHandler.GetPublicPosts))
	router.HandleFunc("/posts/", authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/comments") {
			if r.Method == http.MethodPost {
				postHandler.CreateComment(w, r)
				return
			}
			if r.Method == http.MethodGet {
				postHandler.GetComments(w, r)
				return
			}
		}
		if strings.Contains(r.URL.Path, "/comments/") {
			if r.Method == http.MethodDelete {
				postHandler.DeleteComment(w, r)
				return
			}
		}
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
	router.HandleFunc("/unfollow", authMiddleware.RequireAuth(followerHandler.Unfollow))

	// Group routes
	router.HandleFunc("/groups", authMiddleware.RequireAuth(groupHandler.HandleGroups))
	router.HandleFunc("/groups/user", authMiddleware.RequireAuth(groupHandler.GetUserGroups))
	router.HandleFunc("/groups/members", authMiddleware.RequireAuth(groupHandler.GetGroupMembers))
	router.HandleFunc("/groups/join", authMiddleware.RequireAuth(groupHandler.RequestToJoinGroup))
	router.HandleFunc("/groups/requests", authMiddleware.RequireAuth(groupHandler.GetGroupJoinRequests))
	router.HandleFunc("/groups/requests/respond", authMiddleware.RequireAuth(groupHandler.HandleJoinRequestResponse))
	router.HandleFunc("/groups/invite", authMiddleware.RequireAuth(groupHandler.HandleInvite))
	router.HandleFunc("/groups/invites", authMiddleware.RequireAuth(groupHandler.GetPendingInvites))
	router.HandleFunc("/groups/invites/respond", authMiddleware.RequireAuth(groupHandler.HandleInviteResponse))
	router.HandleFunc("/groups/posts", authMiddleware.RequireAuth(groupHandler.HandlePosts))
	router.HandleFunc("/groups/events", authMiddleware.RequireAuth(groupHandler.HandleEvents))
	router.HandleFunc("/groups/events/respond", authMiddleware.RequireAuth(groupHandler.HandleEventResponse))
	router.HandleFunc("/groups/events/responses", authMiddleware.RequireAuth(groupHandler.GetEventResponses))

	// Chat routes
	router.HandleFunc("/chat/private", authMiddleware.RequireAuth(chatHandler.GetPrivateMessageHistory))
	router.HandleFunc("/chat/group", authMiddleware.RequireAuth(chatHandler.GetGroupMessageHistory))
	router.HandleFunc("/chat/private/send", authMiddleware.RequireAuth(chatHandler.SendPrivateMessage))
	router.HandleFunc("/chat/group/send", authMiddleware.RequireAuth(chatHandler.SendGroupMessage))
	router.HandleFunc("/chat/unread", authMiddleware.RequireAuth(chatHandler.GetUnreadMessageSenders))
	router.HandleFunc("/chat/mark-read", authMiddleware.RequireAuth(chatHandler.MarkMessagesRead))

	// User routes
	router.HandleFunc("/users", userHandler.GetAllUsers)
	router.HandleFunc("/users/", userHandler.GetUserByUUID)
	router.HandleFunc("/users/visibility", authMiddleware.RequireAuth(userHandler.GetProfileVisibility))
	router.HandleFunc("/users/visibility/update", authMiddleware.RequireAuth(userHandler.UpdateProfileVisibility))

	// WebSocket route
	router.HandleFunc("/ws", authMiddleware.RequireAuth(webSocketHandler.HandleConnections))

	// Notifications
	router.HandleFunc("/notifications", authMiddleware.RequireAuth(notificationHandler.GetNotifications))
	router.HandleFunc("/notifications/read", authMiddleware.RequireAuth(notificationHandler.MarkAsRead))

	// Start server
	log.Printf("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", middleware.CORS(router)))
}
