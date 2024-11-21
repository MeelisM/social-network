class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = [];
    this.isConnected = false;
  }

  connect(url) {
    if (this.isConnected) return;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connected");
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

    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this.isConnected = false;
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  addMessageListener(callback) {
    this.listeners.push(callback);
  }

  removeMessageListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
