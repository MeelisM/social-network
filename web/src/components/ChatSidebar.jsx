import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Paper,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getFriendList } from "../service/friendlist";
import webSocketService from "../service/websocket";
import { useAuth } from "../context/AuthContext";

function ChatSidebar({ onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatBoxRef = useRef(null);

  const currentUserId = user?.user_id;

  useEffect(() => {
    console.log(`Current User ID: ${currentUserId}`);

    const fetchFriends = async () => {
      try {
        const friendList = await getFriendList();
        setFriends(friendList);
      } catch (err) {
        console.error("Error loading friends:", err.message);
        setError("Failed to load friend list.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUserId]);

  useEffect(() => {
    const handleIncomingMessage = (message) => {
      if (message.type === "new_message") {
        console.log("New message received:", message);
        if (
          selectedUser &&
          (message.sender_id === selectedUser.id || message.recipient_id === selectedUser.id)
        ) {
          setMessages((prev) => [
            ...prev,
            {
              ...message,
              isSent: message.sender_id === currentUserId,
            },
          ]);
        }
      }
    };

    webSocketService.addMessageListener(handleIncomingMessage);

    return () => {
      webSocketService.removeMessageListener(handleIncomingMessage);
    };
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      console.log(`Chat ID: ${selectedUser.id}`);
      const payload = {
        type: "get_message_history",
        chat_id: selectedUser.id,
      };
      webSocketService.sendMessage(payload);

      const handleMessageHistory = (message) => {
        if (message.type === "message_history" && message.chat_id === selectedUser.id) {
          const sentMessages = message.content.sent_messages.map((msg) => ({
            ...msg,
            isSent: true,
          }));
          const receivedMessages = message.content.received_messages.map((msg) => ({
            ...msg,
            isSent: false,
          }));

          const allMessages = [...sentMessages, ...receivedMessages].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          setMessages(allMessages);
          console.log("Received Messages:", allMessages);
        }
      };

      webSocketService.addMessageListener(handleMessageHistory);

      return () => {
        webSocketService.removeMessageListener(handleMessageHistory);
      };
    }
  }, [selectedUser]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const payload = {
      type: "send_message",
      recipient_id: selectedUser.id,
      content: newMessage,
    };

    webSocketService.sendMessage(payload);

    setMessages((prev) => [
      ...prev,
      {
        sender_id: currentUserId,
        recipient_id: selectedUser.id,
        content: newMessage,
        created_at: new Date().toISOString(),
        isSent: true,
      },
    ]);

    setNewMessage("");
  };

  return (
    <Box
      sx={{
        width: 450,
        bgcolor: "#1f1f1f",
        color: "white",
        padding: 2,
        position: "fixed",
        top: 64,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.5)",
      }}
    >
      {selectedUser ? (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #333",
              paddingBottom: 2,
              marginBottom: 2,
              paddingTop: 4,
            }}
          >
            <IconButton
              onClick={() => setSelectedUser(null)}
              sx={{ color: "#90caf9", marginRight: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: "#90caf9", fontWeight: "bold" }}>
              Chat with {selectedUser.nickname}
            </Typography>
          </Box>

          <Box
            ref={chatBoxRef}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: 2,
              bgcolor: "#121212",
              borderRadius: 2,
            }}
          >
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: message.isSent ? "flex-end" : "flex-start",
                    marginBottom: 2,
                  }}
                >
                  <Paper
                    sx={{
                      padding: 2,
                      maxWidth: "70%",
                      bgcolor: message.isSent ? "#90caf9" : "#333",
                      color: message.isSent ? "#000" : "#fff",
                      borderRadius: 2,
                    }}
                  >
                    <Typography>{message.content}</Typography>
                  </Paper>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: "#b0bec5", textAlign: "center" }}>
                No messages yet. Start the conversation!
              </Typography>
            )}
          </Box>

          <Box
            component="form"
            sx={{
              display: "flex",
              alignItems: "center",
              marginTop: 2,
              paddingTop: 2,
              borderTop: "1px solid #333",
            }}
            onSubmit={handleSendMessage}
          >
            <TextField
              placeholder="Type a message..."
              fullWidth
              variant="outlined"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              sx={{
                bgcolor: "#333",
                borderRadius: 2,
                input: { color: "#fff" },
                marginRight: 2,
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#90caf9",
                color: "black",
                "&:hover": { bgcolor: "#80b7e8" },
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
              paddingTop: 4,
            }}
          >
            <Typography variant="h6" sx={{ color: "#90caf9", fontWeight: "bold" }}>
              Chats
            </Typography>
            <Button
              onClick={onClose}
              sx={{
                color: "white",
                minWidth: 0,
                padding: 0,
                "&:hover": { color: "#90caf9" },
              }}
            >
              <CloseIcon fontSize="large" />
            </Button>
          </Box>
          <Divider sx={{ bgcolor: "#333", marginBottom: 2 }} />

          {loading ? (
            <Typography>Loading friends...</Typography>
          ) : error ? (
            <Typography sx={{ color: "red" }}>{error}</Typography>
          ) : friends.length === 0 ? (
            <Typography>No friends to chat with.</Typography>
          ) : (
            <List
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                padding: 0,
              }}
            >
              {friends.map((friend) => (
                <ListItem
                  button
                  key={friend.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: 1,
                    borderRadius: 1,
                    "&:hover": { bgcolor: "#333" },
                  }}
                  onClick={() => setSelectedUser(friend)}
                >
                  <ListItemText
                    primary={friend.nickname || "Unknown"}
                    primaryTypographyProps={{
                      variant: "body1",
                      color: "white",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ChatSidebar;
