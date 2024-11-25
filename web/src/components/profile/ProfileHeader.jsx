import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';

const ProfileHeader = ({ 
  user, 
  isOwnProfile, 
  isPublic, 
  isFollowing,
  onToggleProfileType, 
  onFollow, 
  onUnfollow,
  onOpenInviteModal 
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        marginBottom: 6,
        maxWidth: "900px",
        margin: "0 auto",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        <Avatar
          sx={{
            width: 70,
            height: 70,
            backgroundColor: "#90caf9",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()}
        </Avatar>
        <Box>
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: "bold",
              marginBottom: 1,
            }}
          >
            {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "No Name"}
          </Typography>
          {user.nickname && (
            <Typography
              variant="subtitle1"
              sx={{
                color: "#b0bec5",
              }}
            >
              @{user.nickname}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {!isOwnProfile && (
          <>
            <Button
              variant="contained"
              color={isFollowing ? "error" : "primary"}
              onClick={isFollowing ? onUnfollow : onFollow}
              sx={{
                height: 40,
                fontSize: "0.875rem",
              }}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onOpenInviteModal}
              sx={{
                height: 40,
                fontSize: "0.875rem",
              }}
            >
              Invite to Group
            </Button>
          </>
        )}
        {isOwnProfile && (
          <Button
            variant="contained"
            color="secondary"
            onClick={onToggleProfileType}
            sx={{
              height: 40,
              fontSize: "0.875rem",
            }}
          >
            Set Profile {isPublic ? "Private" : "Public"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ProfileHeader;