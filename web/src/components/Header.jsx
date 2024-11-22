import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Typography, IconButton, Avatar, Badge, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useAxios } from "../utils/axiosInstance";

function Header({ onToggleSidebar, onToggleChat, onToggleNotification, hasUnreadNotifications }) {
  const { user, setUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
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
              <ChatIcon fontSize="large" color="primary" />
            </IconButton>
            <IconButton
              onClick={() => navigate("/posts/new")} // Navigate to new post page
              sx={{ color: "white", marginRight: 2 }}
            >
              <AddIcon fontSize="large" color="primary" />
            </IconButton>
            <Typography
              variant="body1"
              sx={{ color: "white", marginX: 1, fontSize: "1.2rem" }}
            >
              {user.nickname}
            </Typography>
            <Avatar
              src={user.avatar !== "null" ? user.avatar : "https://via.placeholder.com/150"}
              alt="User Avatar"
              sx={{ marginLeft: 1 }}
            />
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
