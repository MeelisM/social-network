import React, { useState, useEffect } from "react";
import webSocketService from "../service/websocket";

const WebSocketTester = () => {
  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [receivedData, setReceivedData] = useState([]);
  const [error, setError] = useState(null);

  // Handle WebSocket connection
  useEffect(() => {
    console.log("Setting up WebSocket...");
    
    try {
      // Only connect if not already connected
      if (!webSocketService.isConnected && !webSocketService.isConnecting) {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No authentication token found");
          return;
        }
        
        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${token}`;
        console.log("Connecting to WebSocket at:", wsUrl);
        webSocketService.connect(wsUrl);
      }

      // Status checker
      const statusInterval = setInterval(() => {
        setWsStatus(webSocketService.isConnected ? "Connected" : "Disconnected");
      }, 1000);

      return () => {
        clearInterval(statusInterval);
      };
    } catch (err) {
      console.error("WebSocket setup error:", err);
      setError(err.message);
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (message) => {
      console.log("Received message:", message);
      setReceivedData(prev => [...prev, message]);
    };

    webSocketService.addMessageListener(handleMessage);

    return () => {
      webSocketService.removeMessageListener(handleMessage);
    };
  }, []);

  const handleGetNotifications = () => {
    try {
      console.log("Requesting notifications...");
      if (!webSocketService.isConnected) {
        setError("WebSocket not connected");
        return;
      }
      webSocketService.getNotifications();
    } catch (err) {
      console.error("Error getting notifications:", err);
      setError(err.message);
    }
  };

  const handleReconnect = () => {
    try {
      webSocketService.disconnect();
      const token = localStorage.getItem('token');
      const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${token}`;
      webSocketService.connect(wsUrl);
    } catch (err) {
      console.error("Reconnection error:", err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>WebSocket Tester</h1>
      
      {/* Status and Error Display */}
      <div style={{ marginBottom: "20px" }}>
        <p>Status: {wsStatus}</p>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={handleReconnect}
          style={{ marginRight: "10px" }}
        >
          Reconnect
        </button>
        <button 
          onClick={handleGetNotifications}
          disabled={!webSocketService.isConnected}
        >
          Get Notifications
        </button>
      </div>

      {/* Data Display */}
      <div>
        <h3>Received Messages:</h3>
        <div style={{ 
          border: "1px solid #ccc", 
          padding: "10px",
          marginTop: "10px",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          {receivedData.length === 0 ? (
            <p>No messages received yet</p>
          ) : (
            receivedData.map((data, index) => (
              <pre key={index} style={{ 
                margin: "5px 0",
                padding: "10px",
                background: "#f5f5f5",
                borderRadius: "4px"
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTester;