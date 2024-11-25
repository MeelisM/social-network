import { useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./views/Login";
import MainPage from "./views/MainPage";
import ProfilePage from "./views/ProfilePage";
import FollowersPage from "./views/FollowersPage";
import RegisterPage from "./views/RegisterPage";
import UsersPage from "./views/UsersPage";
import PleaseLoginOrRegister from "./components/utils/PleaseLoginOrRegister";
import NewPostPage from "./views/NewPostPage";
import YourGroups from "./views/YourGroups";
import JoinedGroups from "./views/JoinedGroups";
import AllGroups from "./views/AllGroups";
import GroupPage from "./views/GroupPage";
import webSocketService from "./service/websocket";
import WebSocketTester from "./components/WebSocketTester";

function App() {
  return (
    <AuthProvider>
      <WebSocketInitializer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/profile/:identifier" element={<ProfilePage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/login-required" element={<PleaseLoginOrRegister />} />
        <Route path="/posts/new" element={<NewPostPage />} />
        <Route path="/your-groups" element={<YourGroups />} />
        <Route path="/joined-groups" element={<JoinedGroups />} />
        <Route path="/all-groups" element={<AllGroups />} />
        <Route path="/group/:id" element={<GroupPage />} />
        <Route path="/websocket-test" element={<WebSocketTester />} />

      </Routes>
    </AuthProvider>
  );
}

function WebSocketInitializer() {
  const { user } = useAuth();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (user && !isConnectedRef.current) {
      const websocketUrl = "ws://localhost:8080/ws"; // Replace with your server's WebSocket URL
      webSocketService.connect(websocketUrl);
      isConnectedRef.current = true;
      console.log("WebSocket connected");
    } else if (!user && isConnectedRef.current) {
      webSocketService.disconnect();
      isConnectedRef.current = false;
      console.log("WebSocket disconnected");
    }
    // Only run effect when authentication status changes
  }, [user ? user.user_id : null]);

  return null;
}

export default App;
