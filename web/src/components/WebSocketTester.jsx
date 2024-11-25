import React, { useState, useEffect } from "react";
import webSocketService from "../service/websocket";

const WebSocketTester = () => {
  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [receivedData, setReceivedData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  useEffect(() => {
    console.log("Setting up WebSocket...");
    try {
      if (!webSocketService.isConnected && !webSocketService.isConnecting) {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No authentication token found");
          return;
        }
        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${token}`;
        webSocketService.connect(wsUrl);
      }
      const statusInterval = setInterval(() => {
        setWsStatus(webSocketService.isConnected ? "Connected" : "Disconnected");
      }, 1000);
      return () => clearInterval(statusInterval);
    } catch (err) {
      console.error("WebSocket setup error:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (message) => {
      console.log("Received message:", message);
      setReceivedData(prev => [...prev, message]);
    };
    webSocketService.addMessageListener(handleMessage);
    return () => webSocketService.removeMessageListener(handleMessage);
  }, []);

  const handleGetNotifications = () => {
    try {
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

  const handleGetGroupHistory = () => {
    try {
      if (!webSocketService.isConnected) {
        setError("WebSocket not connected");
        return;
      }
      if (!selectedGroupId) {
        setError("Please enter a group ID");
        return;
      }
      webSocketService.getMessageHistory({ type: "group", id: selectedGroupId });
    } catch (err) {
      console.error("Error getting group history:", err);
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
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">WebSocket Tester</h1>
      
      <div className="mb-5">
        <p>Status: {wsStatus}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleReconnect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reconnect
          </button>
          <button
            onClick={handleGetNotifications}
            disabled={!webSocketService.isConnected}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Get Notifications
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            placeholder="Enter Group ID"
            className="px-4 py-2 border rounded w-64"
          />
          <button
            onClick={handleGetGroupHistory}
            disabled={!webSocketService.isConnected}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Get Group History
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Received Messages:</h3>
          <div className="border p-4 max-h-96 overflow-y-auto">
            {receivedData.length === 0 ? (
              <p>No messages received yet</p>
            ) : (
              receivedData.map((data, index) => (
                <pre key={index} className="my-2 p-3 bg-gray-100 rounded">
                  {JSON.stringify(data, null, 2)}
                </pre>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTester;