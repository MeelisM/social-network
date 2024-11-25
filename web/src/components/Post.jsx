import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  TextField, 
  Button, 
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { MoreVert, Delete, Edit, Image } from '@mui/icons-material';
import PostService from "../service/post";

function Post({ post, onPostUpdate, onPostDelete }) {
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editingPost, setEditingPost] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentAnchorEl, setCommentAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);

  // Post menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Comment menu handlers
  const handleCommentMenuOpen = (event, comment) => {
    setCommentAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };
  const handleCommentMenuClose = () => {
    setCommentAnchorEl(null);
    setSelectedComment(null);
  };

  // Post actions
  const handleEditPost = async () => {
    try {
      await PostService.updatePost(post.id, { content: editedContent });
      onPostUpdate && onPostUpdate();
      setEditingPost(false);
      handleMenuClose();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async () => {
    try {
      await PostService.deletePost(post.id, post.image_path);
      onPostDelete && onPostDelete();
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCommentImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  // Comment actions
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;
    
    setLoading(true);
    try {
      await PostService.createComment(post.id, {
        content: commentText,
        image: commentImage
      });
      
      setCommentText('');
      setCommentImage(null);
      setCommentImagePreview(null);
      onPostUpdate && onPostUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditComment = async () => {
    if (!selectedComment || !editingComment) return;

    try {
      await PostService.updateComment(post.id, selectedComment.id, { content: editingComment });
      setEditingComment(null);
      setSelectedComment(null);
      handleCommentMenuClose();
      onPostUpdate && onPostUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    try {
      await PostService.deleteComment(post.id, selectedComment.id, selectedComment.image_path);
      handleCommentMenuClose();
      onPostUpdate && onPostUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <Paper sx={{ padding: 3, backgroundColor: "#1f1f1f", color: "#ffffff", borderRadius: 3 }}>
      {/* Post Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={post.avatar !== "null" && post.avatar !== "" ? post.avatar : "https://via.placeholder.com/50"}
            alt={`${post.first_Name} ${post.last_Name}`}
            sx={{ width: 50, height: 50, marginRight: 2, border: "2px solid #90caf9" }}
          />
          <Box>
            <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
              {`${post.first_Name} ${post.last_Name}`}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "#90caf9" }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
          <MoreVert />
        </IconButton>
      </Box>

      {/* Post Content */}
      {editingPost ? (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            sx={{
              backgroundColor: '#2f2f2f',
              borderRadius: 1,
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditingPost(false)} color="error" variant="contained">
              Cancel
            </Button>
            <Button onClick={handleEditPost} color="primary" variant="contained">
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="body1" sx={{ color: "#b0bec5", mb: 3 }}>
            {post.content}
          </Typography>
          {/* Display post image if it exists */}
          {post.image_path && (
            <Box sx={{ mb: 3 }}>
              <img
                src={post.image_path}
                alt="Post image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Comments Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Comments
        </Typography>
        
        {/* Add Comment Form */}
        <Box component="form" onSubmit={handleAddComment} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{
              backgroundColor: '#2f2f2f',
              borderRadius: 1,
              '& .MuiInputBase-input': { color: 'white' }
            }}
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id={`comment-image-${post.id}`}
              type="file"
              onChange={handleCommentImageChange}
            />
            <label htmlFor={`comment-image-${post.id}`}>
              <IconButton component="span" sx={{ color: '#90caf9' }}>
                <Image />
              </IconButton>
            </label>
            
            {commentImagePreview && (
              <Box sx={{ position: 'relative' }}>
                <img
                  src={commentImagePreview}
                  alt="Comment preview"
                  style={{ height: 40, borderRadius: 4 }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setCommentImage(null);
                    setCommentImagePreview(null);
                  }}
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    color: 'error.main'
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            )}
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || (!commentText.trim() && !commentImage)}
            >
              {loading ? <CircularProgress size={24} /> : 'Comment'}
            </Button>
          </Box>
        </Box>

        {/* Comments List */}
        <Box sx={{ ml: 2 }}>
          {post.comments?.map((comment) => (
            <Box key={comment.id} sx={{ mb: 2, p: 2, backgroundColor: '#2f2f2f', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={"https://via.placeholder.com/30"}
                    alt="Social Network User"
                    sx={{ width: 30, height: 30 }}
                  />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Social Network User
                  </Typography>
                </Box>
                
                <IconButton 
                  size="small" 
                  onClick={(e) => handleCommentMenuOpen(e, comment)}
                  sx={{ color: 'white' }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#b0bec5', mt: 1, ml: 4 }}>
                {comment.content}
              </Typography>
              
              {comment.image_path && (
                <Box
                  component="img"
                  src={comment.image_path}
                  alt="Comment image"
                  sx={{
                    maxWidth: "300px",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: 2,
                    mt: 2,
                    ml: 4
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Post Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setEditingPost(true);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} /> Edit Post
        </MenuItem>
        <MenuItem onClick={handleDeletePost}>
          <Delete sx={{ mr: 1 }} /> Delete Post
        </MenuItem>
      </Menu>

      {/* Comment Menu */}
      <Menu
        anchorEl={commentAnchorEl}
        open={Boolean(commentAnchorEl)}
        onClose={handleCommentMenuClose}
      >
        <MenuItem onClick={() => {
          setEditingComment(selectedComment.content);
          handleCommentMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} /> Edit Comment
        </MenuItem>
        <MenuItem onClick={handleDeleteComment}>
          <Delete sx={{ mr: 1 }} /> Delete Comment
        </MenuItem>
      </Menu>

      {/* Edit Comment Dialog */}
      <Dialog open={Boolean(editingComment)} onClose={() => setEditingComment(null)}>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editingComment || ''}
            onChange={(e) => setEditingComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingComment(null)}>Cancel</Button>
          <Button onClick={handleEditComment} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default Post;
