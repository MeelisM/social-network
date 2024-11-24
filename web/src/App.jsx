import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./views/Login";
import MainPage from "./views/MainPage";
import ProfilePage from "./views/ProfilePage";
import FollowersPage from "./views/FollowersPage";
import RegisterPage from "./views/RegisterPage";
import WebSocketTester from "./components/WebSocketTester"; // New component for testing
import UsersPage from "./views/UsersPage";
import PleaseLoginOrRegister from "./components/utils/PleaseLoginOrRegister";
import NewPostPage from "./views/NewPostPage"; 
import YourGroups from "./views/YourGroups"; 
import JoinedGroups from "./views/JoinedGroups"; 
import AllGroups from "./views/AllGroups"; 
import GroupPage from "./views/GroupPage";
import webSocketService from "./service/websocket";

function App() {
  useEffect(() => {
    const websocketUrl = "ws://localhost:8080/ws"; // Replace with your server's WebSocket URL
    webSocketService.connect(websocketUrl);

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/profile/:identifier" element={<ProfilePage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/test-websocket" element={<WebSocketTester />} /> {/* Add WebSocketTester route */}
        <Route path="/login-required" element={<PleaseLoginOrRegister />} />
        <Route path="/posts/new" element={<NewPostPage />} />
        <Route path="/your-groups" element={<YourGroups />} /> 
        <Route path="/joined-groups" element={<JoinedGroups />} /> 
        <Route path="/all-groups" element={<AllGroups />} /> 
        <Route path="/group/:id" element={<GroupPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
