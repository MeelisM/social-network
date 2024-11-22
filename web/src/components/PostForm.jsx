import React, { useState } from "react";
import PostService from "../service/post"; 
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
} from "@mui/material";

function PostForm() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [viewers, setViewers] = useState([]);
  const [group, setGroup] = useState("everyone");

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        content,
        image: image || null, 
        privacy,
        viewers: privacy === "almost_private" ? viewers : [],
        group,
      };
      const response = await PostService.createPost(postData);
      console.log("Post created successfully:", response);
      alert("Post created successfully!"); 
      setContent(""); 
      setImage(null);
      setPrivacy("public");
      setViewers([]);
      setGroup("everyone");
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again."); 
    }
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

      <TextField
        label="Write something..."
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        variant="filled"
        fullWidth
        sx={{
          marginBottom: 3,
          input: { backgroundColor: "#333", color: "#fff" },
          label: { color: "#fff" },
        }}
      />

      <Box sx={{ marginBottom: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ color: "#90caf9", marginBottom: 1 }}
        >
          Upload an Image (optional)
        </Typography>
        <Button
          variant="contained"
          component="label"
          sx={{
            backgroundColor: "#90caf9",
            color: "#1f1f1f",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#5a9bd4" },
          }}
        >
          Choose File
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </Button>
        {image && (
          <Typography
            variant="body2"
            sx={{ marginTop: 1, color: "#b0bec5" }}
          >
            Selected: {image.name}
          </Typography>
        )}
      </Box>

      <FormControl fullWidth variant="filled" sx={{ marginBottom: 3 }}>
        <InputLabel sx={{ color: "#90caf9" }}>Privacy</InputLabel>
        <Select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          sx={{
            backgroundColor: "#333",
            color: "#fff",
            ".MuiSelect-icon": { color: "#90caf9" },
          }}
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="private">Private</MenuItem>
          <MenuItem value="almost_private">Partially Private</MenuItem>
        </Select>
      </FormControl>

      {privacy === "almost_private" && (
        <FormControl fullWidth variant="filled" sx={{ marginBottom: 3 }}>
          <InputLabel sx={{ color: "#90caf9" }}>Select Viewers</InputLabel>
          <Select
            multiple
            value={viewers}
            onChange={(e) => setViewers(e.target.value)}
            input={<OutlinedInput />}
            renderValue={(selected) => selected.join(", ")}
            sx={{
              backgroundColor: "#333",
              color: "#fff",
              ".MuiSelect-icon": { color: "#90caf9" },
            }}
          >
            {["User1", "User2", "User3"].map((user) => (
              <MenuItem key={user} value={user}>
                <Checkbox checked={viewers.indexOf(user) > -1} />
                <ListItemText primary={user} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl fullWidth variant="filled" sx={{ marginBottom: 3 }}>
        <InputLabel sx={{ color: "#90caf9" }}>Post To</InputLabel>
        <Select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          sx={{
            backgroundColor: "#333",
            color: "#fff",
            ".MuiSelect-icon": { color: "#90caf9" },
          }}
        >
          <MenuItem value="everyone">Everyone</MenuItem>
          {["Group1", "Group2", "Group3"].map((grp) => (
            <MenuItem key={grp} value={grp}>
              {grp}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        fullWidth
        type="submit"
        sx={{
          backgroundColor: "#90caf9",
          color: "#1f1f1f",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#5a9bd4" },
        }}
      >
        Submit Post
      </Button>
    </Paper>
  );
}

export default PostForm;
