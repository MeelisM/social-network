import { Box, CssBaseline } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';
import NotificationSidebar from '../components/NotificationSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState, useEffect, useCallback } from 'react';
import webSocketService from '../service/websocket';
import { useAuth } from '../context/AuthContext';

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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { user } = useAuth();

  // Listener for incoming messages
  const handleIncomingMessage = useCallback(
    (message) => {
      if (!user) return;

      if (
        message.type === "new_private_message" &&
        message.content.recipient_id === user.user_id
      ) {
        const chatId = message.content.sender_id;

        setUnreadCounts((prevCounts) => {
          const count = prevCounts[chatId] || 0;
          const newCounts = { ...prevCounts, [chatId]: count + 1 };
          const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
          setHasUnreadMessages(totalUnread > 0);
          return newCounts;
        });
      } else if (message.type === "unread_messages") {
        // Handle the initial unread messages received from the server
        const { has_unread, senders } = message.content;

        // Ensure senders is an array
        const senderList = Array.isArray(senders) ? senders : [];

        setUnreadCounts(() => {
          const newCounts = {};
          senderList.forEach((senderId) => {
            newCounts[senderId] = 1; // Assuming at least one unread message
          });
          const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
          setHasUnreadMessages(totalUnread > 0);
          return newCounts;
        });
      }
      // Handle other message types if needed
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket if not already connected
    if (!webSocketService.isConnected && !webSocketService.isConnecting) {
      const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${localStorage.getItem('token')}`;
      webSocketService.connect(wsUrl);
    }

    webSocketService.addMessageListener(handleIncomingMessage);

    // Request unread messages when the component mounts or when the user logs in
    webSocketService.getUnreadMessages();

    return () => {
      webSocketService.removeMessageListener(handleIncomingMessage);
    };
  }, [user, handleIncomingMessage]);

  const handleLogout = () => {
    console.log('Logout clicked');
    // Logout logic placeholder
  };

  const handleToggleChat = () => {
    setChatSidebarOpen(!isChatSidebarOpen);
    setNotificationSidebarOpen(false); // Close notifications if chat is open
    // Do not reset hasUnreadMessages here
  };

  const handleToggleNotification = () => {
    setNotificationSidebarOpen(!isNotificationSidebarOpen);
    setChatSidebarOpen(false); // Close chat if notifications are open
    // Reset unread notifications when notification sidebar is opened
    if (!isNotificationSidebarOpen) {
      setHasUnreadNotifications(false);
    }
  };

  // Reset unread counts when a chat is opened
  const handleChatSelect = useCallback((chatId) => {
    setUnreadCounts((prevCounts) => {
      const newCounts = { ...prevCounts };
      delete newCounts[chatId];
      // Update hasUnreadMessages
      const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setHasUnreadMessages(totalUnread > 0);
      return newCounts;
    });

    // Mark messages as read for the selected chat
    const selectedUser = { id: chatId, type: 'private' };
    webSocketService.markMessagesAsRead(selectedUser);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onToggleChat={handleToggleChat}
        onToggleNotification={handleToggleNotification}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
        hasUnreadNotifications={hasUnreadNotifications}
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
            <ChatSidebar
              onClose={() => setChatSidebarOpen(false)}
              onChatSelect={handleChatSelect}
              unreadCounts={unreadCounts}
            />
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
            <NotificationSidebar
              onClose={() => setNotificationSidebarOpen(false)}
              onHasUnreadNotificationsChange={(hasUnread) => setHasUnreadNotifications(hasUnread)}
            />
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default MainLayout;
