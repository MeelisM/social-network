import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Paper,
  CircularProgress,
  Alert,
  Snackbar, 
} from "@mui/material";
import { useAxios } from "../utils/axiosInstance";
import useFetchUsers from "../service/useFetchUsers"; 
import { useAuth } from "../context/AuthContext";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function PostForm() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false); 
  const [snackbarMessage, setSnackbarMessage] = useState(""); 
  const axios = useAxios();
  const { user } = useAuth(); 

  const { users, loadingUsers, usersError } = useFetchUsers();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      const postData = {
        content,
        privacy,
        viewer_ids: privacy === "almost_private" ? viewers : [], 
      };

      console.log("Sending postData:", postData); 

      formData.append('postData', JSON.stringify(postData));

      if (image) {
        formData.append('image', image);
      }

      const response = await axios.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Post created successfully:", response.data);

      // Reset form
      setContent("");
      setImage(null);
      setImagePreview(null);
      setPrivacy("public");
      setViewers([]);

      // Show success snackbar
      setSnackbarMessage("Post created successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = (e) => {
    setPrivacy(e.target.value);
    if (e.target.value !== "almost_private") {
      setViewers([]); 
    }
  };

  const handleViewersChange = (event) => {
    const {
      target: { value },
    } = event;
    setViewers(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        padding: 4,
        backgroundColor: "#1f1f1f",
        color: "#ffffff",
        borderRadius: 3,
        maxWidth: "900px",
        margin: "0 auto",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          color: "#90caf9",
          fontWeight: "bold",
          marginBottom: 4,
        }}
      >
        Create a New Post
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

      <TextField
        label="Write something..."
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        variant="filled"
        fullWidth
        required
        sx={{
          marginBottom: 3,
          "& .MuiFilledInput-root": {
            backgroundColor: "#333",
            "&:hover, &.Mui-focused": {
              backgroundColor: "#444",
            },
          },
          "& .MuiInputLabel-root": { color: "#90caf9" },
          "& .MuiFilledInput-input": { color: "#fff" },
        }}
      />

      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="subtitle1" sx={{ color: "#90caf9", marginBottom: 1 }}>
          Upload an Image (optional)
        </Typography>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="post-image"
          type="file"
          onChange={handleImageChange}
          disabled={loading}
        />
        <label htmlFor="post-image">
          <Button
            variant="contained"
            component="span"
            disabled={loading}
            sx={{
              backgroundColor: "#90caf9",
              color: "#1f1f1f",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#5a9bd4" },
            }}
          >
            Choose File
          </Button>
        </label>

        {/* Display Image Upload Errors */}
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        {/* Display Image Preview */}
        {imagePreview && (
          <Box sx={{ mt: 2 }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
            />
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
              sx={{ mt: 1 }}
              disabled={loading}
            >
              Remove Image
            </Button>
          </Box>
        )}
      </Box>

      <FormControl fullWidth variant="filled" sx={{ marginBottom: 3 }}>
        <InputLabel sx={{ color: "#90caf9" }}>Privacy</InputLabel>
        <Select
          value={privacy}
          onChange={handlePrivacyChange}
          sx={{
            backgroundColor: "#333",
            color: "#fff",
            ".MuiSelect-icon": { color: "#90caf9" },
          }}
          required
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="private">Private</MenuItem>
          <MenuItem value="almost_private">Partially Private</MenuItem>
        </Select>
      </FormControl>

      {privacy === "almost_private" && (
        <FormControl fullWidth variant="filled" sx={{ marginBottom: 3 }}>
          <InputLabel sx={{ color: "#90caf9" }}>Select Viewers</InputLabel>
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : usersError ? (
            <Typography color="error" variant="body2">
              {usersError}
            </Typography>
          ) : (
            <Select
              multiple
              value={viewers}
              onChange={handleViewersChange}
              input={<OutlinedInput label="Select Viewers" />}
              renderValue={(selected) => {
                const selectedNames = users
                  .filter(user => selected.includes(user.id))
                  .map(user => user.fullName)
                  .join(", ");
                return selectedNames;
              }}
              sx={{
                backgroundColor: "#333",
                color: "#fff",
                ".MuiSelect-icon": { color: "#90caf9" },
              }}
              MenuProps={MenuProps}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Checkbox checked={viewers.indexOf(user.id) > -1} />
                  <ListItemText primary={user.fullName} />
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
      )}

      <Button
        variant="contained"
        fullWidth
        type="submit"
        disabled={
          loading ||
          !content.trim() ||
          (privacy === "almost_private" && viewers.length === 0)
        }
        sx={{
          backgroundColor: "#90caf9",
          color: "#1f1f1f",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#5a9bd4" },
        }}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: "#1f1f1f" }} />
        ) : (
          "Submit Post"
        )}
      </Button>

      {/* Snackbar for Success Messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
}

export default PostForm;
