import axios from "axios";
import webSocketService from "./websocket";

const chatService = {
  sendPrivateMessage: (recipientId, content) => {
    axios
      .post(
        "http://localhost:8080/chat/private/send",
        { recipient_id: recipientId, content },
        { withCredentials: true }
      )
      .catch((err) => console.error("Error sending private message:", err));
  },

  getPrivateMessageHistory: async (peerId) => {
    try {
      const response = await axios.get(`http://localhost:8080/chat/private?peer_id=${peerId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("Error fetching private message history:", err);
      return [];
    }
  },

  sendGroupMessage: (groupId, content) => {
    axios
      .post(
        "http://localhost:8080/chat/group/send",
        { group_id: groupId, content },
        { withCredentials: true }
      )
      .catch((err) => console.error("Error sending group message:", err));
  },

  getGroupMessageHistory: async (groupId) => {
    try {
      const response = await axios.get(`http://localhost:8080/chat/group?group_id=${groupId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("Error fetching group message history:", err);
      return [];
    }
  },

  markMessagesAsRead: (senderId) => {
    axios
      .post(
        "http://localhost:8080/chat/mark-read",
        { sender_id: senderId },
        { withCredentials: true }
      )
      .catch((err) => console.error("Error marking messages as read:", err));
  },
};

export default chatService;
