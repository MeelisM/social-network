// ConnectionsList.jsx

import React from 'react';
import { Grid, Paper, Typography, Avatar, Box, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ConnectionsList = ({ followers, following, canViewFullProfile }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  if (!canViewFullProfile) {
    return (
      <Grid
        container
        spacing={4}
        sx={{
          marginTop: 4,
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Grid item xs={6}>
          <Paper
            sx={{
              padding: 3,
              backgroundColor: "#1f1f1f",
              color: "#ffffff",
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Followers
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
              Connections are private.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper
            sx={{
              padding: 3,
              backgroundColor: "#1f1f1f",
              color: "#ffffff",
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Following
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
              Connections are private.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  const UserCard = ({ user }) => (
    <Box
      onClick={() => navigate(`/profile/${user.id}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 1,
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        marginBottom: 2,
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          backgroundColor: "#90caf9",
          fontSize: "1rem",
          fontWeight: "bold",
        }}
      >
        {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()}
      </Avatar>
      <Box>
        <Typography
          sx={{
            fontSize: "0.95rem",
            color: "white",
            fontWeight: "medium",
          }}
        >
          {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User"}
        </Typography>
        {user.nickname && (
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: "#b0bec5",
            }}
          >
            @{user.nickname}
          </Typography>
        )}
        {user.email && (
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#757575",
            }}
          >
            {user.email}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Grid
      container
      spacing={4}
      sx={{
        marginTop: 4,
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <Grid item xs={6}>
        <Paper
          sx={{
            padding: 3,
            backgroundColor: "#1f1f1f",
            color: "#ffffff",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Followers ({followers.length})
          </Typography>
          <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
            {followers.length > 0 ? (
              followers.map((follower) => (
                <UserCard key={follower.id} user={follower} />
              ))
            ) : (
              <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
                No followers.
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={6}>
        <Paper
          sx={{
            padding: 3,
            backgroundColor: "#1f1f1f",
            color: "#ffffff",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Following ({following.length})
          </Typography>
          <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
            {following.length > 0 ? (
              following.map((followed) => (
                <UserCard key={followed.id} user={followed} />
              ))
            ) : (
              <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
                Not following anyone.
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ConnectionsList;
