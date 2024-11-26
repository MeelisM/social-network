import React, { useState } from "react";
import { Typography, Paper, Button, TextField, Modal, CircularProgress, Alert } from "@mui/material";
import { createGroupPost } from "../../service/group";

const Post = ({ groupId, posts, setPosts }) => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null); 

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setFormLoading(true);
    setError(null); 
    try {
      const payload = { content: newPost };
      const response = await createGroupPost(groupId, payload);

      if (response?.data) {
        setPosts((prevPosts) => [response.data, ...prevPosts]);
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

      {/* Display Error Message if Exists */}
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
