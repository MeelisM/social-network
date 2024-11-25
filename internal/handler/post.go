package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/internal/model"
	"social-network/internal/service"
	"strings"
	"time"

	"github.com/google/uuid"
)

type PostHandler struct {
	PostService *service.PostService
}

const (
	maxUploadSize = 5 << 20 // 5 MB
	uploadDir     = "./uploads/posts"
)

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if this is a multipart form (with image) or regular JSON request
	contentType := r.Header.Get("Content-Type")
	userID := r.Context().Value("user_id").(string)
	var input model.CreatePostInput

	if contentType == "application/json" {
		// Handle regular JSON post without image
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	} else if contentType[:19] == "multipart/form-data" {
		// Handle multipart form with image
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "File too large. Maximum size is 5MB", http.StatusBadRequest)
			return
		}

		// Parse the post data from form
		postData := r.FormValue("postData")
		if err := json.Unmarshal([]byte(postData), &input); err != nil {
			http.Error(w, "Invalid post data", http.StatusBadRequest)
			return
		}

		// Handle image upload if present
		file, header, err := r.FormFile("image")
		if err == nil { // Image was provided
			defer file.Close()

			// Validate file type
			if !isValidImageType(header.Header.Get("Content-Type")) {
				http.Error(w, "Invalid file type. Only images are allowed", http.StatusBadRequest)
				return
			}

			// Create uploads directory if it doesn't exist
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
				os.Remove(fullPath) // Clean up on error
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}

			// Set the relative path in the input
			relativePath := fmt.Sprintf("/uploads/posts/%s", filename)
			input.ImagePath = &relativePath
		}
	} else {
		http.Error(w, "Unsupported content type", http.StatusBadRequest)
		return
	}

	// Create the post using the existing service
	post, err := h.PostService.CreatePost(userID, input)
	if err != nil {
		// Clean up uploaded file if post creation fails
		if input.ImagePath != nil {
			os.Remove(filepath.Join(".", *input.ImagePath))
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	return validTypes[contentType]
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

	// Get the post first to get the image path
	post, err := h.PostService.GetPost(postID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete the post from database
	if err := h.PostService.DeletePost(postID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Clean up image if it exists
	if post.ImagePath != nil {
		if err := os.Remove(filepath.Join(".", *post.ImagePath)); err != nil {
			// Log the error but don't fail the request
			fmt.Printf("Failed to delete image file: %v\n", err)
		}
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

func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get post ID from URL path
	postID := strings.TrimPrefix(r.URL.Path, "/posts/")
	postID = strings.TrimSuffix(postID, "/comments")

	userID := r.Context().Value("user_id").(string)
	var imagePath *string

	// Parse multipart form for image upload
	contentType := r.Header.Get("Content-Type")
	if contentType != "application/json" {
		err := r.ParseMultipartForm(maxUploadSize)
		if err != nil {
			http.Error(w, "File too large", http.StatusBadRequest)
			return
		}

		// Handle image upload if present
		file, header, err := r.FormFile("image")
		if err == nil { // Image was provided
			defer file.Close()

			if !isValidImageType(header.Header.Get("Content-Type")) {
				http.Error(w, "Invalid file type", http.StatusBadRequest)
				return
			}

			// Create uploads directory if it doesn't exist
			uploadDir := "./uploads/comments"
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

			relativePath := fmt.Sprintf("/uploads/comments/%s", filename)
			imagePath = &relativePath
		}

		// Get content from form field
		content := r.FormValue("content")
		comment, err := h.PostService.CreateComment(postID, userID, content, imagePath)
		if err != nil {
			if imagePath != nil {
				os.Remove(filepath.Join(".", *imagePath))
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(comment)
		return
	}

	// Handle JSON request (backward compatibility)
	var input struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	comment, err := h.PostService.CreateComment(postID, userID, input.Content, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func (h *PostHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	postID := strings.TrimPrefix(r.URL.Path, "/posts/")
	postID = strings.TrimSuffix(postID, "/comments")

	userID := r.Context().Value("user_id").(string)
	comments, err := h.PostService.GetPostComments(postID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comments)
}

func (h *PostHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	commentID := pathParts[len(pathParts)-1]
	userID := r.Context().Value("user_id").(string)

	// Get comment to check for image
	comment, err := h.PostService.GetComment(commentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete the comment
	if err := h.PostService.DeleteComment(commentID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete associated image if it exists
	if comment.ImagePath != nil {
		if err := os.Remove(filepath.Join(".", *comment.ImagePath)); err != nil {
			// Log the error but don't fail the request
			fmt.Printf("Failed to delete comment image: %v\n", err)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *PostHandler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Retrieve user ID from query parameter
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Use the PostService to fetch the posts
	posts, err := h.PostService.GetUserPosts(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the posts as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
