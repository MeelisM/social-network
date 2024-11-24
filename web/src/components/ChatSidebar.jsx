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
  CircularProgress,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import { getFriendList } from "../service/friendlist";
import { getJoinedGroups, getOwnedGroups } from "../service/group";
import chatService from "../service/chat";
import webSocketService from "../service/websocket";
import { useAuth } from "../context/AuthContext";

// Utility to generate a random color
const getRandomColor = () => {
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#A833FF", "#FFC733"];
  return colors[Math.floor(Math.random() * colors.length)];
};

function ChatSidebar({ onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatBoxRef = useRef(null);

  const currentUserId = user?.user_id;

  // Fetch friends and groups
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [friendList, ownedGroupsResponse, joinedGroupsResponse] = await Promise.all([
          getFriendList(),
          getOwnedGroups(),
          getJoinedGroups(),
        ]);

        setFriends(friendList || []);

        // Owned groups
        const ownedGroupsData = ownedGroupsResponse?.data?.owned_groups || [];
        // Joined groups
        const joinedGroupsData =
          Array.isArray(joinedGroupsResponse?.data?.member_groups) &&
          joinedGroupsResponse?.data?.member_groups.length
            ? joinedGroupsResponse.data.member_groups
            : [];

        // Merge owned and joined groups without duplicates
        const mergedGroups = [
          ...ownedGroupsData,
          ...joinedGroupsData.filter(
            (joinedGroup) =>
              !ownedGroupsData.some((ownedGroup) => ownedGroup.id === joinedGroup.id)
          ),
        ];

        setGroups(mergedGroups);
      } catch (err) {
        console.error("Error loading groups:", err.message);
        setError("Failed to load groups.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  // Handle incoming messages
  useEffect(() => {
    const handleIncomingMessage = (message) => {
      if (
        selectedUser &&
        ((selectedUser.type === "private" &&
          (message.sender_id === selectedUser.id || message.recipient_id === selectedUser.id)) ||
          (selectedUser.type === "group" && message.group_id === selectedUser.id))
      ) {
        setMessages((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          {
            ...message,
            isSent: message.sender_id === currentUserId,
          },
        ]);
      }
    };

    webSocketService.addMessageListener(handleIncomingMessage);

    return () => {
      webSocketService.removeMessageListener(handleIncomingMessage);
    };
  }, [selectedUser, currentUserId]);

  // Fetch message history
  useEffect(() => {
    const fetchMessageHistory = async () => {
      if (!selectedUser) return;

      setLoading(true);
      try {
        let data = [];
        if (selectedUser.type === "private") {
          const response = await chatService.getPrivateMessageHistory(selectedUser.id);
          data = [
            ...(response?.sent || []).map((msg) => ({
              ...msg,
              isSent: true,
            })),
            ...(response?.received || []).map((msg) => ({
              ...msg,
              isSent: false,
            })),
          ];
        } else if (selectedUser.type === "group") {
          const response = await chatService.getGroupMessageHistory(selectedUser.id);
          data = (response || []).map((msg) => ({
            ...msg,
            isSent: msg.sender_id === currentUserId,
          }));
        }

        data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(data);
      } catch (err) {
        console.error("Error fetching message history:", err);
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessageHistory();
  }, [selectedUser, currentUserId]);

  // Scroll to the latest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    if (selectedUser.type === "private") {
      chatService.sendPrivateMessage(selectedUser.id, newMessage);
    } else if (selectedUser.type === "group") {
      chatService.sendGroupMessage(selectedUser.id, newMessage);
    }

    setMessages((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        sender_id: currentUserId,
        recipient_id: selectedUser.type === "private" ? selectedUser.id : null,
        group_id: selectedUser.type === "group" ? selectedUser.id : null,
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
        top: 80,
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
            }}
          >
            <IconButton
              onClick={() => setSelectedUser(null)}
              sx={{ color: "#90caf9", marginRight: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: "#90caf9", fontWeight: "bold" }}>
              Chat with {selectedUser.nickname || selectedUser.title}
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
            {loading ? (
              <CircularProgress sx={{ color: "#90caf9", display: "block", margin: "auto" }} />
            ) : messages.length > 0 ? (
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
              marginBottom: 3,
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
            <CircularProgress sx={{ color: "white", display: "block", margin: "auto" }} />
          ) : (
            <>
              <List sx={{ flexGrow: 1, overflowY: "auto", padding: 0 }}>
                {[...friends, ...groups].map((item) => (
                  <ListItem
                    button
                    key={item.id}
                    onClick={() =>
                      setSelectedUser({ ...item, type: item.nickname ? "private" : "group" })
                    }
                    sx={{
                      padding: 1,
                      "&:hover": { bgcolor: "#333" },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getRandomColor(),
                        marginRight: 2,
                      }}
                    >
                      {item.nickname ? <PersonIcon /> : <GroupIcon />}
                    </Avatar>
                    <ListItemText
                      primary={item.nickname || item.title}
                      primaryTypographyProps={{ variant: "body1", color: "white" }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ChatSidebar;
