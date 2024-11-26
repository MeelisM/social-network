import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const UserPosts = ({ posts, canViewFullProfile }) => {
  if (!canViewFullProfile) {
    return (
      <Box
        sx={{
          margin: "0 auto",
          maxWidth: "900px",
          marginTop: 3,
          marginBottom: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
          Posts
        </Typography>
        <Typography sx={{ color: "#b0bec5" }}>
          Posts are private.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        margin: "0 auto",
        maxWidth: "900px",
        marginTop: 3,
        marginBottom: 4,
      }}
    >
      <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
        Posts
      </Typography>
      <Grid container spacing={2}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <Paper
                sx={{
                  padding: 2,
                  backgroundColor: "#1f1f1f",
                  color: "#ffffff",
                  borderRadius: 3,
                }}
              >
                <Typography variant="body1" sx={{ color: "#b0bec5" }}>
                  {post.content}
                </Typography>
                {/* Display post date */}
                <Typography
                  variant="caption"
                  sx={{ color: "#808080", display: "block", marginTop: 1 }}
                >
                  {post.createdAt && !isNaN(new Date(post.createdAt)) ? (
                    new Date(post.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium', 
                      timeStyle: 'short', 
                    })
                  ) : (
                    "Unknown Date"
                  )}
                </Typography>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ color: "#b0bec5" }}>
              No posts yet.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UserPosts;
