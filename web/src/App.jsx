import { Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import MainPage from './views/MainPage';
import ProfilePage from './views/ProfilePage';
import FollowersPage from './views/FollowersPage'; // Import FollowersPage
import RegisterPage from './views/RegisterPage'; // Import RegisterPage

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} /> {/* Add RegisterPage */}
      <Route path="/main" element={<MainPage />} />
      <Route path="/profile" element={<ProfilePage userId="1" />} />
      <Route path="/followers" element={<FollowersPage />} />
    </Routes>
  );
}

export default App;

