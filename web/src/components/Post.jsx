// src/components/Post.jsx

import React, { useState, useCallback } from 'react';
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
import { MoreVert, Delete, Edit, Image, BrokenImage } from '@mui/icons-material';
import PostService from "../service/post";
import { useAuth } from "../context/AuthContext"; // Import the Auth context
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection

function Post({ post, onPostUpdate, onPostDelete }) {
  const { user } = useAuth(); // Get the logged-in user from context
  const navigate = useNavigate(); // Initialize navigate for redirection

  const [imageError, setImageError] = useState(false);
  const [commentImageErrors, setCommentImageErrors] = useState({});
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentAnchorEl, setCommentAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);

  // Image handling
  const handleImageError = useCallback((e) => {
    console.error('Image failed to load:', e.target.src);
    setImageError(true);
  }, []);

  const getImageUrl = useCallback((path) => {
    if (!path) return null;
    const baseUrl = 'http://localhost:8080';
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    console.log('Image URL:', fullUrl);
    return fullUrl;
  }, []);

  const handleCommentImageError = useCallback((commentId) => {
    console.error('Comment image failed to load for comment:', commentId);
    setCommentImageErrors(prev => ({
      ...prev,
      [commentId]: true
    }));
  }, []);

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
    const previewUrl = URL.createObjectURL(file);
    setCommentImagePreview(previewUrl);

    // Cleanup preview URL when component unmounts
    return () => URL.revokeObjectURL(previewUrl);
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
  
  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    try {
      await PostService.deleteComment(post.id, selectedComment.id, selectedComment.image_path);
      handleCommentMenuClose();
      onPostUpdate && onPostUpdate();
      navigate("/posts"); // Redirect to posts page after deleting a comment
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Debug log for post data
  console.log('Post Data:', {
    id: post.id,
    content: post.content,
    image_path: post.image_path,
    comments: post.comments
  });

  return (
    <Paper sx={{ padding: 3, backgroundColor: "#1f1f1f", color: "#ffffff", borderRadius: 3 }}>
      {/* Post Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={post.avatar ? getImageUrl(post.avatar) : null}
            alt={`${post.first_name} ${post.last_name}`}
            sx={{ width: 50, height: 50, marginRight: 2, border: "2px solid #90caf9" }}
          >
            {/* Fallback to initials if no avatar */}
            {!post.avatar && `${post.first_name?.[0]}${post.last_name?.[0]}`}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
              {`${post.first_name} ${post.last_name}`}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "#90caf9" }}>
              {new Date(post.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        {/* Show menu only if the logged-in user is the post owner */}
        {user?.user_id === post.user_id && (
          <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
            <MoreVert />
          </IconButton>
        )}
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
          
          {post.image_path && !imageError ? (
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'center',
              backgroundColor: '#2f2f2f',
              borderRadius: 2,
              padding: 2,
              position: 'relative'
            }}>
              <img
                src={getImageUrl(post.image_path)}
                alt="Post content"
                onError={handleImageError}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  color: '#fff',
                  display: 'none', // Set to 'block' for debugging
                }}
              >
                {post.image_path}
              </Typography>
            </Box>
          ) : post.image_path && imageError ? (
            <Box sx={{ 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2f2f2f',
              borderRadius: 2,
              padding: 4,
              gap: 2
            }}>
              <BrokenImage sx={{ color: '#666', fontSize: 40 }} />
              <Box>
                <Typography color="error" variant="body2">
                  Failed to load image
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {post.image_path}
                </Typography>
              </Box>
            </Box>
          ) : null}
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
              sx={{ marginLeft: 'auto' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Comment'}
            </Button>
          </Box>
        </Box>

        {/* Comments List */}
        <Box sx={{ ml: 2 }}>
          {post.comments?.map((comment) => {
            return (
              <Box key={comment.id} sx={{ mb: 2, p: 2, backgroundColor: '#2f2f2f', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={comment.user_avatar ? getImageUrl(comment.user_avatar) : null}
                      alt={`${comment.first_name} ${comment.last_name}`}
                      sx={{ width: 30, height: 30 }}
                    >
                      {/* Fallback to initials if no avatar */}
                      {!comment.user_avatar && `${comment.first_name?.[0]}${comment.last_name?.[0]}`}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ color: 'white' }}>
                      {`${comment.first_name} ${comment.last_name}`}
                    </Typography>
                  </Box>
                    
                  {/* Show comment menu only if the logged-in user is the comment owner */}
                  {user?.user_id === comment.user_id && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleCommentMenuOpen(e, comment)}
                      sx={{ color: 'white' }}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>
                
                <Typography variant="body2" sx={{ color: '#b0bec5', mt: 1, ml: 4 }}>
                  {comment.content}
                </Typography>
                
                {(comment.image_path) && (
                  <Box sx={{ 
                    position: 'relative',
                    mt: 2,
                    ml: 4
                  }}>
                    {commentImageErrors[comment.id] ? (
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: '#2a2a2a',
                        p: 2,
                        borderRadius: 1
                      }}>
                        <BrokenImage sx={{ color: '#666', fontSize: 24 }} />
                        <Box>
                          <Typography color="error" variant="body2">
                            Failed to load image
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {comment.image_path}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <img
                        src={getImageUrl(comment.image_path)}
                        alt="Comment content"
                        onError={() => handleCommentImageError(comment.id)}
                        style={{
                          maxWidth: "300px",
                          maxHeight: "200px",
                          objectFit: "contain",
                          borderRadius: "8px"
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
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
        {/* Removed Edit Comment MenuItem */}
        <MenuItem onClick={handleDeleteComment}>
          <Delete sx={{ mr: 1 }} /> Delete Comment
        </MenuItem>
      </Menu>
      
      {/* Edit Comment Dialog - Removed */}
    </Paper>
  );
}

export default Post;
