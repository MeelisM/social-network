import React, { useState, useEffect } from "react";
import webSocketService from "../service/websocket"; // Your WebSocket service

const WebSocketTester = () => {
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [error, setError] = useState(null);

  const userId = "46ff8242-05be-4b99-b01c-d09b33a8aad6"; // Replace with your specific user ID

  // Fetch initial messages through WebSocket
  const fetchMessagesThroughWebSocket = () => {
    try {
      const payload = {
        type: "get_message_history",
        chat_id: userId, // Use chat_id to specify the user
      };
      webSocketService.sendMessage(payload);
      console.log("Requesting message history via WebSocket:", payload);
    } catch (err) {
      console.error("Error fetching message history via WebSocket:", err);
      setError(err.message);
    }
  };

  // Send a message via WebSocket
  const sendMessage = () => {
    if (message.trim() !== "") {
      const messagePayload = {
        type: "send_message",
        recipient_id: userId, // Specify recipient
        content: message,
      };
      webSocketService.sendMessage(messagePayload);
      console.log("Sending message:", messagePayload);
      setMessage(""); // Clear the input
    }
  };

  useEffect(() => {
    // Set up WebSocket connection
    webSocketService.connect("ws://localhost:8080/ws"); // Adjust URL if needed

    // Set up WebSocket message listener
    const handleWebSocketMessage = (data) => {
      console.log("Received WebSocket message:", data);
      if (data.type === "message_history") {
        // Handle message history
        setReceivedMessages(data.content || []);
      } else if (data.type === "new_message") {
        // Append new real-time messages
        setReceivedMessages((prev) => [...prev, data]);
      }
    };

    webSocketService.addMessageListener(handleWebSocketMessage);

    // Fetch messages when the component mounts
    fetchMessagesThroughWebSocket();

    // Clean up WebSocket listener on unmount
    return () => {
      webSocketService.removeMessageListener(handleWebSocketMessage);
      webSocketService.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>WebSocket Tester</h1>

      {/* Fetch Messages Button */}
      <div>
        <button onClick={fetchMessagesThroughWebSocket}>Fetch Messages</button>
      </div>

      {/* Send Message */}
      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {/* Display Messages */}
      <div>
        <h2>Received Messages:</h2>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        <ul>
          {receivedMessages.map((msg, index) => (
            <li key={index}>{JSON.stringify(msg)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketTester;