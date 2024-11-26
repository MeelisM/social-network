import React, { useState } from "react";
import { 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Modal, 
  CircularProgress, 
  Alert,
  Box,
  Divider 
} from "@mui/material";
import { createGroupPost, createGroupPostComment } from "../../service/group";

const Post = ({ groupId, posts, setPosts }) => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setFormLoading(true);
    setError(null);
    try {
      const payload = { content: newPost };
      const response = await createGroupPost(groupId, payload);

      if (response?.data) {
        setPosts((prevPosts) => [{ ...response.data, comments: [] }, ...prevPosts]);
        setNewPost("");
        setPostModalOpen(false);
      } else {
        throw new Error("No data returned from the server.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;
    
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const payload = {
        post_id: postId,
        content: newComment[postId]
      };
      const response = await createGroupPostComment(groupId, payload);

      if (response?.data) {
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), response.data]
            };
          }
          return post;
        }));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      setError("Failed to create comment. Please try again.");
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Posts
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            marginBottom: 2,
            backgroundColor: "#2f1f1f",
            color: "#ff8a80",
          }}
        >
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={() => setPostModalOpen(true)}
        sx={{
          backgroundColor: "#1f1f1f",
          color: "white",
          marginBottom: 3,
          "&:hover": { backgroundColor: "#333" },
        }}
      >
        + Create Post
      </Button>

      {posts?.length > 0 ? (
        posts.map((post) => (
          <Paper
            key={post.id}
            sx={{
              padding: 2,
              marginBottom: 2,
              backgroundColor: "#1f1f1f",
            }}
          >
            <Typography variant="body1" sx={{ marginBottom: 1 }}>
              {post.content}
            </Typography>
            <Typography variant="caption" sx={{ color: "#b0bec5" }}>
              {formatDate(post.created_at || post.createdAt)}
            </Typography>

            {/* Comments Section */}
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 1, backgroundColor: "#333" }} />
              
              {/* Existing Comments */}
              {post.comments?.map((comment) => (
                <Box key={comment.id} sx={{ my: 1, pl: 2, borderLeft: "2px solid #333" }}>
                  <Typography variant="body2" sx={{ color: "#fff" }}>
                    {comment.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>
              ))}

              {/* New Comment Input */}
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Write a comment..."
                  value={newComment[post.id] || ""}
                  onChange={(e) => setNewComment(prev => ({
                    ...prev,
                    [post.id]: e.target.value
                  }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateComment(post.id);
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#333" },
                      "&:hover fieldset": { borderColor: "#444" },
                      backgroundColor: "#2a2a2a",
                    },
                  }}
                  InputProps={{
                    style: { color: "white" },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleCreateComment(post.id)}
                  disabled={commentLoading[post.id]}
                  sx={{
                    backgroundColor: "#333",
                    "&:hover": { backgroundColor: "#444" },
                    minWidth: "100px",
                  }}
                >
                  {commentLoading[post.id] ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Comment"
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        ))
      ) : (
        <Typography sx={{ color: "white" }}>No posts yet.</Typography>
      )}

      {/* Post Modal */}
      <Modal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper sx={{ padding: 4, backgroundColor: "#1f1f1f", width: "400px" }}>
          <Typography variant="h5" sx={{ marginBottom: 3 }}>
            Create New Post
          </Typography>

          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Write your post..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{
              marginBottom: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#b0bec5" },
                "&:hover fieldset": { borderColor: "white" },
                backgroundColor: "#2a2a2a",
              },
            }}
            InputLabelProps={{
              style: { color: "#b0bec5" },
            }}
            InputProps={{
              style: { color: "white" },
            }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleCreatePost}
            disabled={formLoading}
            sx={{
              backgroundColor: "#333",
              "&:hover": { backgroundColor: "#555" },
            }}
          >
            {formLoading ? <CircularProgress size={24} color="inherit" /> : "Create Post"}
          </Button>
        </Paper>
      </Modal>
    </div>
  );
};

export default Post;