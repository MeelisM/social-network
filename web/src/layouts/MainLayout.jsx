import { Box, CssBaseline } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';
import NotificationSidebar from '../components/NotificationSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState } from 'react';

const drawerWidth = 240;

// Shared layout styles for consistent spacing
export const layoutStyles = {
  sectionSpacing: { marginBottom: 8 },
  boxSpacing: { padding: 3, backgroundColor: '#1f1f1f', borderRadius: 3 },
};

function MainLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isChatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [isNotificationSidebarOpen, setNotificationSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true); // State for unread notifications

  const handleLogout = () => {
    console.log('Logout clicked');
    // Login logic placeholder
  };

  const handleNotificationsOpen = () => {
    setNotificationSidebarOpen(!isNotificationSidebarOpen);
    setChatSidebarOpen(false); // Close chat if notifications are open
    setUnreadNotifications(false); // Mark notifications as read
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onToggleChat={() => {
          setChatSidebarOpen(!isChatSidebarOpen);
          setNotificationSidebarOpen(false); // Close notifications if chat is open
        }}
        onToggleNotification={handleNotificationsOpen} // Handle notification toggle
        onLogout={handleLogout}
        hasUnreadNotifications={unreadNotifications} // Pass unread state to Header
      />

      {/* Main Content Area with Sidebars */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Left Sidebar */}
        {isSidebarOpen && (
          <Box
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              bgcolor: '#1f1f1f',
              color: 'white',
              position: 'fixed',
              left: 0,
              top: 64,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Sidebar />
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: isSidebarOpen ? `${drawerWidth}px` : 0,
            marginRight:
              isChatSidebarOpen || isNotificationSidebarOpen
                ? `${drawerWidth + 50}px`
                : '20px',
            padding: 3,
            bgcolor: '#121212',
            maxWidth: isChatSidebarOpen || isNotificationSidebarOpen ? '85%' : '90%',
            mx: 'auto',
            transition: 'margin 0.3s ease',
          }}
        >
          {children}
        </Box>

        {/* Right Chat Sidebar */}
        {isChatSidebarOpen && (
          <Box
            sx={{
              width: drawerWidth + 50,
              flexShrink: 0,
              bgcolor: '#1f1f1f',
              color: 'white',
              position: 'fixed',
              right: 0,
              top: 64,
              bottom: 0,
            }}
          >
            <ChatSidebar onClose={() => setChatSidebarOpen(false)} />
          </Box>
        )}

        {/* Right Notification Sidebar */}
        {isNotificationSidebarOpen && (
          <Box
            sx={{
              width: drawerWidth + 50,
              flexShrink: 0,
              bgcolor: '#1f1f1f',
              color: 'white',
              position: 'fixed',
              right: 0,
              top: 64,
              bottom: 0,
            }}
          >
            <NotificationSidebar onClose={() => setNotificationSidebarOpen(false)} />
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default MainLayout;
