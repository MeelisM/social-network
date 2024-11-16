import { Box, Typography, IconButton, Avatar, Badge } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout'; // Import Logout Icon

function Header({
  onToggleSidebar,
  onToggleChat,
  onToggleNotification,
  onLogout,
  hasUnreadNotifications, // New prop for unread notifications
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 2,
        bgcolor: '#1f1f1f',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 1200,
      }}
    >
      {/* Left: Toggle Sidebar and App Title */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={onToggleSidebar}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: '#333' },
          }}
        >
          <MenuIcon fontSize="large" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ color: '#90caf9', fontWeight: 'bold', marginLeft: 2 }}
        >
          Social Network
        </Typography>
      </Box>

      {/* Right: User Info, Chat Toggle, Notifications, and Logout */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Notifications Icon with Badge */}
        <IconButton onClick={onToggleNotification}>
          <Badge
            color="error"
            variant="dot"
            invisible={!hasUnreadNotifications} // Show badge only when there are unread notifications
          >
            <NotificationsIcon fontSize="large" color="primary" />
          </Badge>
        </IconButton>

        {/* Chat Icon */}
        <IconButton onClick={onToggleChat}>
          <ChatIcon fontSize="large" color="primary" />
        </IconButton>

        {/* User Info */}
        <Typography
          variant="body1"
          sx={{ color: 'white', marginX: 1, fontSize: '1.2rem' }}
        >
          Kasutaja01
        </Typography>
        <Avatar
          src="https://via.placeholder.com/150"
          alt="User Avatar"
          sx={{ marginLeft: 1 }}
        />

        {/* Logout Icon */}
        <IconButton
          sx={{
            color: 'white',
            marginLeft: 2,
            '&:hover': { bgcolor: '#333' },
          }}
          onClick={onLogout}
        >
          <LogoutIcon fontSize="large" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default Header;
