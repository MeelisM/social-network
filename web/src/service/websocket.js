class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = [];
    this.isConnected = false;
    this.url = null; // Store the WebSocket URL
  }

  connect(url) {
    if (this.isConnected) {
      console.warn("WebSocket is already connected");
      return;
    }

    this.url = url; // Save the WebSocket URL
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connected to:", this.url);
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);
        this.listeners.forEach((listener) => listener(message));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket disconnected:", event.reason || "No reason provided");
      this.isConnected = false;

      // Optional: Attempt reconnection after a delay
      setTimeout(() => {
        console.log("Attempting WebSocket reconnection...");
        this.reconnect();
      }, 5000); // Reconnect after 5 seconds
    };
  }

  reconnect() {
    if (this.url) {
      this.connect(this.url);
    } else {
      console.error("WebSocket URL is not set. Cannot reconnect.");
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting WebSocket...");
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendMessage(message) {
    if (this.socket && this.isConnected) {
      console.log("Sending WebSocket message:", message);
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected. Cannot send message.");
    }
  }

  addMessageListener(callback) {
    this.listeners.push(callback);
    console.log("Added WebSocket message listener. Total listeners:", this.listeners.length);
  }

  removeMessageListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
    console.log("Removed WebSocket message listener. Total listeners:", this.listeners.length);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;