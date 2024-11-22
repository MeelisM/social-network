import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./views/Login";
import MainPage from "./views/MainPage";
import ProfilePage from "./views/ProfilePage";
import FollowersPage from "./views/FollowersPage";
import RegisterPage from "./views/RegisterPage";
import WebSocketTester from "./components/WebSocketTester";
import UsersPage from "./views/UsersPage"; 

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/profile/:identifier" element={<ProfilePage />} /> 
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/users" element={<UsersPage />} /> 
        <Route path="/test-websocket" element={<WebSocketTester />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
