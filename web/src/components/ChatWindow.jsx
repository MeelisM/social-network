import { Box, IconButton, Typography, Paper, TextField, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function ChatWindow({ user, onBack }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1f1f1f',
        color: '#ffffff',
        padding: 2,
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 2,
          borderBottom: '1px solid #333',
          paddingBottom: 1,
        }}
      >
        <IconButton onClick={onBack} sx={{ color: '#90caf9' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ marginLeft: 1, fontWeight: 'bold', color: '#90caf9' }}>
          Chat with {user.first_name} {user.last_name}
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
        {/* Example messages */}
        {user.messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
              marginBottom: 2,
            }}
          >
            <Paper
              sx={{
                padding: 2,
                maxWidth: '70%',
                bgcolor: message.isOwn ? '#90caf9' : '#333',
                color: message.isOwn ? '#000' : '#fff',
                borderRadius: 2,
              }}
            >
              <Typography>{message.text}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Chat Input */}
      <Box
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 2,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          // Handle message send
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
            marginRight: 1,
          }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{
            bgcolor: '#90caf9',
            color: '#000',
            '&:hover': { bgcolor: '#80b7e8' },
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default ChatWindow;
