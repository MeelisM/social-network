import { Box, Typography, Button, List, ListItem, ListItemText, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { notifications } from '../mockData'; 

function NotificationSidebar({ onClose }) {
  const [showSidebar, setShowSidebar] = useState(true);

  if (!showSidebar) return null;

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
      {/* Sidebar Header */}
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
        <Button
          onClick={() => {
            setShowSidebar(false);
            if (onClose) onClose();
          }}
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

      {/* Notification List */}
      <List
        sx={{
          flexGrow: 1,
          overflowY: 'auto', 
          padding: 0,
        }}
      >
        {notifications.map((notification) => (
          <ListItem
            key={notification.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: 2,
              borderRadius: 1,
              '&:hover': {
                bgcolor: '#333',
              },
            }}
          >
            <ListItemText
              primary={notification.text}
              primaryTypographyProps={{
                variant: 'body1',
                color: 'white',
                marginBottom: 1,
              }}
              secondary={notification.timestamp}
              secondaryTypographyProps={{
                variant: 'body2',
                color: '#90caf9',
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Footer */}
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
    </Box>
  );
}

export default NotificationSidebar;
