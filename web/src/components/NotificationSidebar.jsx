import { Box, Typography, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import webSocketService from '../service/websocket';
import { useAuth } from '../context/AuthContext';

function NotificationSidebar({ onClose, onHasUnreadNotificationsChange, notifications, setNotifications }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const { user } = useAuth();

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
    // Mark all notifications as read
    if (webSocketService.isConnected) {
      notifications.forEach(notification => {
        if (!notification.is_read) {
          webSocketService.markNotificationAsRead(notification.id);
        }
      });
    }

    setShowSidebar(false);
    if (onClose) onClose();
    if (onHasUnreadNotificationsChange) {
      onHasUnreadNotificationsChange(false);
    }
  };

  if (!showSidebar) return null;

  return (
    <Box sx={{
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
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
        paddingTop: 4,
      }}>
        <Typography variant="h6" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Button
          onClick={handleClose}
          sx={{
            color: 'white',
            minWidth: 0,
            padding: 0,
            '&:hover': { color: '#90caf9' },
          }}
        >
          <CloseIcon fontSize="large" />
        </Button>
      </Box>
      
      <Divider sx={{ bgcolor: '#333', marginBottom: 2 }} />
      
      <List sx={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: 0,
      }}>
        {notifications?.length > 0 ? (
          notifications.map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 2,
                borderRadius: 1,
                bgcolor: notification.is_read ? 'transparent' : 'rgba(144, 202, 249, 0.08)',
                '&:hover': {
                  bgcolor: '#333',
                },
              }}
            >
              <ListItemText
                primary={notification.content}
                primaryTypographyProps={{
                  variant: 'body1',
                  color: notification.is_read ? '#b0bec5' : 'white',
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
            No notifications yet
          </Typography>
        )}
      </List>
      
      {notifications?.length > 0 && (
        <>
          <Divider sx={{ bgcolor: '#333', marginTop: 2 }} />
          <Typography
            variant="body1"
            sx={{
              color: '#b0bec5',
              textAlign: 'center',
              marginTop: 2,
              fontSize: '1.2rem',
            }}
          >
            You're all caught up!
          </Typography>
        </>
      )}
    </Box>
  );
}

export default NotificationSidebar;