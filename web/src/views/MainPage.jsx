import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Grid, Alert } from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import PostService from "../service/post";
import Post from "../components/Post"; 

function MainPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handlePostUpdate = async () => {
    try {
      const fetchedPosts = await PostService.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error refreshing posts:", error);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching posts...");
        const fetchedPosts = await PostService.getPosts();
        console.log("Received posts:", fetchedPosts);
        
        if (!fetchedPosts) {
          throw new Error("No data received from server");
        }
        
        if (!Array.isArray(fetchedPosts)) {
          throw new Error(`Expected array of posts but got: ${typeof fetchedPosts}`);
        }
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.message || "Failed to load posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <MainLayout>
      <Box
        sx={{
          padding: 4,
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "white",
            fontWeight: "bold",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Feed
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              marginBottom: 4,
              backgroundColor: "#2f1f1f",
              color: "#ff8a80"
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography
            variant="h6"
            sx={{ color: "white", textAlign: "center", marginTop: 4 }}
          >
            Loading posts...
          </Typography>
        ) : posts.length === 0 ? (
          <Typography
            variant="h6"
            sx={{ color: "white", textAlign: "center", marginTop: 4 }}
          >
            No posts available.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {posts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Post
                  post={post}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostUpdate}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </MainLayout>
  );
}

export default MainPage;