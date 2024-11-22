package handler

import (
	"encoding/json"
	"net/http"
	"social-network/internal/model"
	"social-network/internal/service"
)

type PostHandler struct {
	PostService *service.PostService
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
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
	post, err := h.PostService.CreatePost(userID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

func (h *PostHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Path[len("/posts/"):]
	if postID == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	post, err := h.PostService.GetPost(postID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(post)
}

func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
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
	post, err := h.PostService.UpdatePost(postID, userID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(post)
}

func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Path[len("/posts/"):]
	if postID == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)
	if err := h.PostService.DeletePost(postID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *PostHandler) GetPublicPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Retrieve the user ID from the context
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized: user ID missing from context", http.StatusUnauthorized)
		return
	}

	// Fetch all posts with nicknames
	posts, err := h.PostService.GetPublicPosts(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the fetched posts
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
