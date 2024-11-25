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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { MoreVert, Delete, Edit, Gif } from '@mui/icons-material';
import PostService from "../service/post";
import GiphyPicker from './GiphyPicker';

function Post({ post, onPostUpdate, onPostDelete }) {
  const [commentText, setCommentText] = useState('');
  const [commentGif, setCommentGif] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isPickingForComment, setIsPickingForComment] = useState(false);
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

  const handleGifSelect = (gif) => {
    if (isPickingForComment) {
      setCommentGif(gif);
    } else {
      // Handle gif selection for post editing if needed
    }
    setShowGifPicker(false);
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
      await PostService.deletePost(post.id);
      onPostDelete && onPostDelete();
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Comment actions
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentGif) return;
  
    try {
      await PostService.createComment(post.id, { 
        content: commentText,
        gif: commentGif 
      });
      setCommentText('');
      setCommentGif(null);
      onPostUpdate && onPostUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const openGifPicker = (forComment = true) => {
    setIsPickingForComment(forComment);
    setShowGifPicker(true);
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
      await PostService.deleteComment(post.id, selectedComment.id);
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
          {post.gifUrl && (
            <Box
              component="img"
              src={post.gifUrl}
              alt="Post GIF"
              sx={{
                width: "100%",
                maxWidth: "500px",
                borderRadius: 2,
                display: "block",
                margin: "20px auto",
              }}
            />
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
            <IconButton 
              onClick={() => openGifPicker(true)}
              sx={{ color: '#90caf9' }}
            >
              <Gif />
            </IconButton>
            {commentGif && (
              <Box
                component="img"
                src={commentGif.url}
                alt="Selected GIF"
                sx={{
                  height: 40,
                  borderRadius: 1
                }}
              />
            )}
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!commentText.trim() && !commentGif}
            >
              Comment
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
              
              {comment.gifUrl && (
                <Box
                  component="img"
                  src={comment.gifUrl}
                  alt="Comment GIF"
                  sx={{
                    maxWidth: "300px",
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

      {/* GIF Picker Dialog */}
      <GiphyPicker
        open={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
      />
    </Paper>
  );
}

export default Post;