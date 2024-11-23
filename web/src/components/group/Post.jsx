import React, { useState } from "react";
import { Typography, Paper, Button, TextField, Modal } from "@mui/material";
import { createGroupPost } from "../../service/groupService";

const Post = ({ groupId, posts, setPosts }) => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try {
      const payload = { content: newPost };
      const response = await createGroupPost(groupId, payload);

      setPosts((prevPosts) => [response.data, ...prevPosts]);
      setNewPost(""); // Clear input
      setPostModalOpen(false); // Close modal
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Posts
      </Typography>
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
            <Typography variant="body1">{post.content}</Typography>
            <Typography variant="caption" sx={{ color: "#b0bec5" }}>
              {new Date(post.createdAt).toLocaleString()}
            </Typography>
          </Paper>
        ))
      ) : (
        <Typography>No posts yet.</Typography>
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
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreatePost}
            sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#555" } }}
          >
            Create Post
          </Button>
        </Paper>
      </Modal>
    </div>
  );
};

export default Post;
