import webSocketService from './websocket';

const chatService = {
  sendMessage: (recipientId, content) => {
    if (!webSocketService.isConnected) {
      console.error('WebSocket is not connected.');
      return;
    }

    try {
      const message = {
        type: 'send_message', // Assuming this is the message type expected by the backend
        recipient_id: recipientId,
        content: content,
      };

      console.log('Sending message:', message);
      webSocketService.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  getMessageHistory: async (userId) => {
    try {
      const response = await fetch(`/messages?peer_id=${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch message history: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching message history:', error);
      return [];
    }
  },

  addMessageListener: (callback) => {
    webSocketService.addMessageListener((message) => {
      if (message.type === 'new_message') {
        callback(message);
      }
    });
  },

  removeMessageListener: (callback) => {
    webSocketService.removeMessageListener(callback);
  },
};

export default chatService;
