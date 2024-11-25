// webSocketService.js

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = [];
    this.isConnected = false;
    this.isConnecting = false;
    this.url = null; // Store the WebSocket URL
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(url) {
    if (this.isConnected || this.isConnecting) {
      console.warn("WebSocket is already connected or connecting");
      return;
    }

    this.url = url; // Save the WebSocket URL
    this.isConnecting = true;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(message));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.isConnecting = false;
      this.socket = null;

      // Attempt reconnection if maximum attempts not reached
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        const delay = Math.min(10000, this.reconnectAttempts * 2000); // Exponential backoff
        setTimeout(() => {
          this.reconnect();
        }, delay);
      } else {
        console.error("Maximum WebSocket reconnection attempts reached.");
      }
    };
  }

  reconnect() {
    if (this.isConnected || this.isConnecting) {
      console.warn("WebSocket is already connected or connecting");
      return;
    }

    if (this.url) {
      this.connect(this.url);
    } else {
      console.error("WebSocket URL is not set. Cannot reconnect.");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  sendMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected. Cannot send message.");
    }
  }

  addMessageListener(callback) {
    this.listeners.push(callback);
  }

  removeMessageListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  // --- WebSocket Message Wrappers ---

  getNotifications() {
    this.sendMessage({ type: "get_notifications" });
  }

  markNotificationAsRead(notificationId) {
    this.sendMessage({
      type: "mark_read",
      notification_id: notificationId,
    });
  }

  sendMessageToRecipient(selectedUser, content) {
    if (!selectedUser || !selectedUser.type) {
      console.error("Invalid selectedUser:", selectedUser);
      return;
    }

    if (selectedUser.type === "private") {
      this.sendMessage({
        type: "send_private_message",
        recipient_id: selectedUser.id,
        content,
      });
    } else if (selectedUser.type === "group") {
      this.sendMessage({
        type: "send_group_message",
        group_id: selectedUser.id,
        content,
      });
    } else {
      console.error("Unknown chat type:", selectedUser.type);
    }
  }

  getMessageHistory(selectedUser) {
    if (!selectedUser || !selectedUser.type) {
      console.error("Invalid selectedUser:", selectedUser);
      return;
    }

    if (selectedUser.type === "private") {
      this.sendMessage({
        type: "get_private_history",
        other_user_id: selectedUser.id,
      });
    } else if (selectedUser.type === "group") {
      this.sendMessage({
        type: "get_group_history",
        group_id: selectedUser.id,
      });
    } else {
      console.error("Unknown chat type:", selectedUser.type);
    }
  }

  markMessagesAsRead(selectedUser) {
    if (!selectedUser || !selectedUser.type) {
      console.error("Invalid selectedUser:", selectedUser);
      return;
    }

    if (selectedUser.type === "private") {
      this.sendMessage({
        type: "mark_messages_read",
        sender_id: selectedUser.id,
      });
    } else if (selectedUser.type === "group") {
      this.sendMessage({
        type: "mark_messages_read",
        group_id: selectedUser.id,
      });
    } else {
      console.error("Unknown chat type:", selectedUser.type);
    }
  }

  getUnreadMessages() {
    this.sendMessage({ type: "get_unread_messages" });
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
