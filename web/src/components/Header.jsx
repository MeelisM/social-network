import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Typography, IconButton, Avatar, Badge, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAxios } from "../utils/axiosInstance";

function Header({
  onToggleSidebar,
  onToggleChat,
  onToggleNotification,
  hasUnreadNotifications,
  hasUnreadMessages,
  onLogout,
}) {
  const { user, setUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();

  // Add debug logging
  useEffect(() => {
    console.log("Current user in Header:", user);
    console.log("LocalStorage user:", JSON.parse(localStorage.getItem('user')));
  }, [user]);

  // Debug function to check user properties
  const getUserDisplay = (user) => {
    if (!user) {
      console.log("User is null or undefined");
      return "No User";
    }
    
    console.log("User properties:", {
      nickname: user.nickname,
      firstName: user.first_name,
      lastName: user.last_name,
      id: user.id
    });
    
    return user.nickname || `${user.first_name} ${user.last_name}` || "Unknown User";
  };

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      if (onLogout) {
        onLogout();
      }
      navigate("/login");
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 2,
        bgcolor: "#1f1f1f",
        borderBottom: "1px solid #333",
        position: "sticky",
        top: 0,
        zIndex: 1200,
      }}
    >
      {/* Left: Toggle Sidebar and App Title */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          onClick={onToggleSidebar}
          sx={{ color: "white", "&:hover": { bgcolor: "#333" } }}
        >
          <MenuIcon fontSize="large" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ color: "#90caf9", fontWeight: "bold", marginLeft: 2 }}
        >
          Social Network
        </Typography>
      </Box>

      {/* Right: User Info or Login Button */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {user ? (
          <>
            <IconButton onClick={onToggleNotification}>
              <Badge
                color="error"
                variant="dot"
                invisible={!hasUnreadNotifications}
              >
                <NotificationsIcon fontSize="large" color="primary" />
              </Badge>
            </IconButton>
            <IconButton onClick={onToggleChat}>
              <Badge
                color="error"
                variant="dot"
                invisible={!hasUnreadMessages}
              >
                <ChatIcon fontSize="large" color="primary" />
              </Badge>
            </IconButton>
            <IconButton
              onClick={() => navigate("/posts/new")}
              sx={{ color: "white", marginRight: 2 }}
            >
              <AddIcon fontSize="large" color="primary" />
            </IconButton>
            <Typography
              variant="body1"
              sx={{ color: "white", marginX: 1, fontSize: "1.2rem" }}
            >
              {getUserDisplay(user)}
            </Typography>
            <Avatar
              src={user.avatar !== "null" ? user.avatar : undefined}
              alt={getUserDisplay(user)}
              sx={{ marginLeft: 1 }}
            >
              {(user.first_name?.[0] || user.nickname?.[0] || "?").toUpperCase()}
            </Avatar>
            <IconButton
              sx={{ color: "white", marginLeft: 2, "&:hover": { bgcolor: "#333" } }}
              onClick={handleLogout}
            >
              <LogoutIcon fontSize="large" />
            </IconButton>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: 1,
            }}
          >
            Log In
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default Header;