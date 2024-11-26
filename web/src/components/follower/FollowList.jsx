import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const FollowList = ({ data, emptyMessage }) => {
  const navigate = useNavigate();
  
  const getInitials = (user) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return `http://localhost:8080${avatarPath}`;
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
      {data && data.length > 0 ? (
        data.map((user, index) => (
          <Paper
            key={user.id || `user-${index}`}
            sx={{
              padding: 2,
              backgroundColor: "#1f1f1f",
              color: "#ffffff",
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => user.id && navigate(`/profile/${user.id}`)}
          >
            <Avatar
              src={user.avatar ? getAvatarUrl(user.avatar) : null}
              sx={{
                width: 70,
                height: 70,
                marginBottom: 2,
                backgroundColor: "#90caf9",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {!user.avatar && getInitials(user)}
            </Avatar>
            <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
              {user.displayName}
            </Typography>
          </Paper>
        ))
      ) : (
        <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
};

export default FollowList;