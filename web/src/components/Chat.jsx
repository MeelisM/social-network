import { Box, Typography } from '@mui/material';

function Chat({ user, lastMessage }) {
  return (
    <Box sx={{ padding: 1.5, bgcolor: '#444', borderRadius: 1, mb: 1 }}>
      <Typography variant="subtitle1" color="primary">{user}</Typography>
      <Typography variant="body2" color="text.secondary">
        {lastMessage}
      </Typography>
    </Box>
  );
}

export default Chat;
