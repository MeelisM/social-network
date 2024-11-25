import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import webSocketService from '../service/websocket';
import { useAuth } from '../context/AuthContext';

function NotificationSidebar({
  onClose,
  onHasUnreadNotificationsChange,
  notifications,
  setNotifications,
  onOpenChat, 
}) {
  const [showSidebar, setShowSidebar] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!user || !webSocketService.isConnected) return;
    webSocketService.getNotifications();
  }, [user]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleClose = () => {
    setShowSidebar(false);
    if (onClose) onClose();
    if (onHasUnreadNotificationsChange) {
      onHasUnreadNotificationsChange(false);
    }
  };

  const handleClearAll = () => {
    if (webSocketService.isConnected) {
      unreadNotifications.forEach((notification) => {
        webSocketService.markNotificationAsRead(notification.id);
      });
    }
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.is_read)
    );
    if (onHasUnreadNotificationsChange) {
      onHasUnreadNotificationsChange(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (webSocketService.isConnected) {
      webSocketService.markNotificationAsRead(notification.id);
    }
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== notification.id)
    );

    if (
      notification.type === 'private_message' ||
      notification.type === 'group_message'
    ) {
      if (onOpenChat) {
        onOpenChat(); 
      }
    } else if (notification.type === 'follow_request') {
      navigate('/followers');
    } else if (notification.type === 'group_invite') {
      navigate('/your-groups');
    }

    if (onClose) onClose();
  };

  if (!showSidebar) return null;

  const unreadNotifications =
    notifications?.filter((notification) => !notification.is_read) || [];

  return (
    <Box
      sx={{
        width: 450,
        bgcolor: '#1f1f1f',
        color: 'white',
        padding: 2,
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
          paddingTop: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Box>
          {/* Clear All button */}
          <Button
            onClick={handleClearAll}
            sx={{
              color: 'white',
              marginRight: 1,
              '&:hover': { color: '#90caf9' },
            }}
          >
            Clear All
          </Button>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              padding: 0,
              '&:hover': { color: '#90caf9' },
            }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ bgcolor: '#333', marginBottom: 2 }} />

      <List
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: 0,
        }}
      >
        {unreadNotifications.length > 0 ? (
          unreadNotifications.map((notification) => (
            <ListItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 2,
                borderRadius: 1,
                bgcolor: 'rgba(144, 202, 249, 0.08)',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#333',
                },
              }}
            >
              <ListItemText
                primary={notification.content}
                primaryTypographyProps={{
                  variant: 'body1',
                  color: 'white',
                  marginBottom: 1,
                }}
                secondary={formatTimestamp(notification.created_at)}
                secondaryTypographyProps={{
                  variant: 'body2',
                  color: '#90caf9',
                }}
              />
            </ListItem>
          ))
        ) : (
          <Typography
            variant="body1"
            sx={{
              color: '#b0bec5',
              textAlign: 'center',
              marginTop: 2,
              fontSize: '1.2rem',
            }}
          >
            No new notifications
          </Typography>
        )}
      </List>
    </Box>
  );
}

export default NotificationSidebar;
