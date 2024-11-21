import React, { useEffect, useState } from "react";
import webSocketService from "../service/websocket";

function WebSocketTester() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    webSocketService.connect("ws://localhost:8080/ws");

    const handleIncomingMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    webSocketService.addMessageListener(handleIncomingMessage);

    return () => {
      webSocketService.removeMessageListener(handleIncomingMessage);
      webSocketService.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    webSocketService.sendMessage({ type: "test", content: inputMessage });
    setInputMessage("");
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>WebSocket Tester</h2>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message"
          style={{ padding: "10px", width: "300px", marginRight: "10px" }}
        />
        <button onClick={handleSendMessage} style={{ padding: "10px 20px" }}>
          Send
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index} style={{ marginBottom: "10px" }}>
              {JSON.stringify(msg)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WebSocketTester;
