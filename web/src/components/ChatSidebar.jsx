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
  Avatar,
  Badge,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import { getFriendList } from "../service/friendlist";
import { getJoinedGroups, getOwnedGroups } from "../service/group";
import webSocketService from "../service/websocket";
import { useAuth } from "../context/AuthContext";

function ChatSidebar({ onClose, onChatSelect, unreadCounts, selectedUser, messages, setMessages }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatBoxRef = useRef(null);
  const currentUserId = user?.user_id;

  // Fetch friends and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendList, ownedGroupsResponse, joinedGroupsResponse] = await Promise.all([
          getFriendList(),
          getOwnedGroups(),
          getJoinedGroups(),
        ]);
        setFriends(friendList || []);

        const ownedGroupsData = ownedGroupsResponse?.data?.owned_groups || [];
        const joinedGroupsData = joinedGroupsResponse?.data?.member_groups || [];
        const mergedGroups = [
          ...ownedGroupsData,
          ...joinedGroupsData.filter(
            (joinedGroup) => !ownedGroupsData.some((ownedGroup) => ownedGroup.id === joinedGroup.id)
          ),
        ];
        setGroups(mergedGroups);
      } catch (err) {
        console.error("Error loading groups:", err.message);
      }
    };
    fetchData();
  }, [currentUserId]);

  // Scroll to latest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !webSocketService.isConnected) return;

    webSocketService.sendMessageToRecipient(selectedUser, newMessage);

    const newMsg = {
      content: newMessage,
      sender_id: currentUserId,
      recipient_id: selectedUser.id,
      created_at: new Date().toISOString(),
      isSent: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
  };

  const handleChatItemClick = (item) => {
    if (onChatSelect) {
      onChatSelect({ ...item, type: item.type || "private" });
    }
  };

  return (
    <Box sx={{
      width: 450,
      bgcolor: "#1f1f1f",
      color: "white",
      padding: 2,
      position: "fixed",
      top: 80,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.5)",
    }}>
      {selectedUser ? (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #333",
            paddingBottom: 2,
            marginBottom: 2,
          }}>
            <IconButton onClick={() => onChatSelect(null)} sx={{ color: "#90caf9", marginRight: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: "#90caf9", fontWeight: "bold" }}>
              Chat with {selectedUser.nickname || selectedUser.title || selectedUser.name}
            </Typography>
          </Box>
          <Box ref={chatBoxRef} sx={{
            flexGrow: 1,
            overflowY: "auto",
            padding: 2,
            bgcolor: "#121212",
            borderRadius: 2,
          }}>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <Box key={index} sx={{
                  display: "flex",
                  justifyContent: message.isSent ? "flex-end" : "flex-start",
                  marginBottom: 2,
                }}>
                  <Paper sx={{
                    padding: 2,
                    maxWidth: "70%",
                    bgcolor: message.isSent ? "#90caf9" : "#333",
                    color: message.isSent ? "#000" : "#fff",
                    borderRadius: 2,
                  }}>
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
          <Box component="form" sx={{
            display: "flex",
            alignItems: "center",
            marginTop: 2,
            paddingTop: 2,
            borderTop: "1px solid #333",
          }} onSubmit={handleSendMessage}>
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
            <Button type="submit" variant="contained" sx={{
              bgcolor: "#90caf9",
              color: "black",
              "&:hover": { bgcolor: "#80b7e8" },
            }}>
              Send
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 3,
          }}>
            <Typography variant="h6" sx={{ color: "#90caf9", fontWeight: "bold" }}>
              Chats
            </Typography>
            <Button onClick={onClose} sx={{
              color: "white",
              minWidth: 0,
              padding: 0,
              "&:hover": { color: "#90caf9" },
            }}>
              <CloseIcon fontSize="large" />
            </Button>
          </Box>
          <Divider sx={{ bgcolor: "#333", marginBottom: 2 }} />
          <Typography variant="subtitle1" sx={{ color: "#90caf9", marginBottom: 1 }}>
            Friends
          </Typography>
          <List sx={{ flexGrow: 1, overflowY: "auto", padding: 0 }}>
            {friends.map((item) => (
              <ListItem
                button
                key={item.id}
                onClick={() => handleChatItemClick({ ...item, type: "private" })}
                sx={{
                  padding: 1,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!unreadCounts[item.id]}
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <Avatar sx={{ bgcolor: "#90caf9", marginRight: 2 }}>
                    <PersonIcon />
                  </Avatar>
                </Badge>
                <ListItemText
                  primary={item.nickname || item.name || "Unknown Friend"}
                  primaryTypographyProps={{ variant: "body1", color: "white" }}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle1" sx={{ color: "#90caf9", marginTop: 2, marginBottom: 1 }}>
            Groups
          </Typography>
          <List sx={{ flexGrow: 1, overflowY: "auto", padding: 0 }}>
            {groups.map((item) => (
              <ListItem
                button
                key={item.id}
                onClick={() => handleChatItemClick({ ...item, type: "group" })}
                sx={{
                  padding: 1,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!unreadCounts[item.id]}
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <Avatar sx={{ bgcolor: "#90caf9", marginRight: 2 }}>
                    <GroupIcon />
                  </Avatar>
                </Badge>
                <ListItemText
                  primary={item.title || item.name || "Unknown Group"}
                  primaryTypographyProps={{ variant: "body1", color: "white" }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default ChatSidebar;