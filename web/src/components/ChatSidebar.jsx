import { Box, Typography, Button, List, ListItem, ListItemText, Divider, IconButton, Paper, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import { followers } from '../mockData'; 

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 20;
  const lightness = 60 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function ChatSidebar({ onClose }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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
      {selectedUser ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              paddingBottom: 2,
              marginBottom: 2,
              paddingTop: 4, 
            }}
          >
            <IconButton
              onClick={() => setSelectedUser(null)}
              sx={{ color: '#90caf9', marginRight: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
              Chat with {selectedUser.name}
            </Typography>
          </Box>

          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: 2,
              bgcolor: '#121212',
              borderRadius: 2,
            }}
          >
            {/* Placeholder messages */}
            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-start' }}>
              <Paper sx={{ padding: 2, bgcolor: '#333', color: 'white', borderRadius: 3 }}>
                <Typography>Hello! How are you?</Typography>
              </Paper>
            </Box>
            <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Paper sx={{ padding: 2, bgcolor: '#90caf9', color: 'black', borderRadius: 3 }}>
                <Typography>I'm good, thanks!</Typography>
              </Paper>
            </Box>
          </Box>

          {/* Chat Input */}
          <Box
            component="form"
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 2,
              paddingTop: 2,
              borderTop: '1px solid #333',
            }}
            onSubmit={(e) => {
              e.preventDefault();
              // Handle sending messages
            }}
          >
            <TextField
              placeholder="Type a message..."
              fullWidth
              variant="outlined"
              sx={{
                bgcolor: '#333',
                borderRadius: 2,
                input: { color: '#fff' },
                marginRight: 2,
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#90caf9',
                color: 'black',
                '&:hover': { bgcolor: '#80b7e8' },
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              Chats
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

          {/* User List */}
          <List
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: 0,
            }}
          >
            {followers.map((follower) => {
              const color = getRandomColor();
              const initials = follower.name
                .split(' ')
                .map((word) => word[0])
                .join('');

              return (
                <ListItem
                  button
                  key={follower.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: '#333',
                    },
                  }}
                  onClick={() => setSelectedUser(follower)}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: follower.avatar ? 'transparent' : color,
                      backgroundImage: follower.avatar ? `url(${follower.avatar})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!follower.avatar && initials}
                  </Box>
                  <ListItemText
                    primary={follower.name}
                    primaryTypographyProps={{
                      variant: 'body1',
                      color: 'white',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>

          {/* Footer */}
          <Divider sx={{ bgcolor: '#333', marginTop: 2 }} />
          <Typography
            variant="body1"
            sx={{
              color: '#b0bec5',
              textAlign: 'center',
              marginTop: 2,
              fontSize: '1.5rem',
            }}
          >
            Select a user to start chatting
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChatSidebar;
