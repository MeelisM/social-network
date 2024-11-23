import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Paper, TextField, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import chatService from '../service/chat';

function ChatWindow({ user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const history = await chatService.getMessageHistory(user.id);
      setMessages(history);
    };

    fetchMessages();

    const handleIncomingMessage = (message) => {
      if (message.sender_id === user.id || message.recipient_id === user.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    chatService.addMessageListener(handleIncomingMessage);

    return () => {
      chatService.removeMessageListener(handleIncomingMessage);
    };
  }, [user.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    chatService.sendMessage(user.id, newMessage);
    setMessages((prev) => [
      ...prev,
      {
        sender_id: 'me', // Replace with current user ID if available
        recipient_id: user.id,
        content: newMessage,
        created_at: new Date(),
      },
    ]);
    setNewMessage('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1f1f1f', color: '#ffffff', padding: 2 }}>
      {/* Chat Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, borderBottom: '1px solid #333', paddingBottom: 1 }}>
        <IconButton onClick={onBack} sx={{ color: '#90caf9' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ marginLeft: 1, fontWeight: 'bold', color: '#90caf9' }}>
          Chat with {user.nickname}
        </Typography>
      </Box>

      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: 2, bgcolor: '#121212', borderRadius: 2 }}>
        {messages.map((message, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: message.sender_id === 'me' ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
            <Paper sx={{ padding: 2, maxWidth: '70%', bgcolor: message.sender_id === 'me' ? '#90caf9' : '#333', color: message.sender_id === 'me' ? '#000' : '#fff', borderRadius: 2 }}>
              <Typography>{message.content}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Chat Input */}
      <Box component="form" sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }} onSubmit={handleSendMessage}>
        <TextField
          placeholder="Type a message..."
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          sx={{ bgcolor: '#333', borderRadius: 2, input: { color: '#fff' }, marginRight: 1 }}
        />
        <Button type="submit" variant="contained" sx={{ bgcolor: '#90caf9', color: '#000', '&:hover': { bgcolor: '#80b7e8' } }}>
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default ChatWindow;
