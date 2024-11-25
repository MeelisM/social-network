import { Box, CssBaseline } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';
import NotificationSidebar from '../components/NotificationSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../service/websocket';
import { useAuth } from '../context/AuthContext';
import { handleWebSocketSetup, handleMessageProcessing } from '../utils/chatHandlers';

const drawerWidth = 240;

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const selectedUserRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const handleIncomingMessage = useCallback((message) => {
    if (!user) return;
  
  
    if (message.type === 'notifications') {
      setNotifications(message.content);
      if (!isNotificationSidebarOpen) {
        const hasUnread = message.content.some(notif => !notif.is_read);
        setHasUnreadNotifications(hasUnread);
      }
      return;
    }
  
    if (!selectedUser && message.type !== "unread_messages") {
      return;
    }
  
    handleMessageProcessing(
      message,
      user,
      selectedUser,
      isChatSidebarOpen,
      webSocketService,
      setMessages,
      setUnreadCounts,
      setHasUnreadMessages
    );
  }, [user, isNotificationSidebarOpen, isChatSidebarOpen]);      

  useEffect(() => {
    if (!user) return;
  
    let messageInterval;
    let unreadInterval;
    let notificationInterval;
  
    const connectAndInitialize = () => {
      if (!webSocketService.isConnected && !webSocketService.isConnecting) {
        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${localStorage.getItem('token')}`;
        webSocketService.connect(wsUrl);
      }
    };
  
    const pollMessages = () => {
      if (webSocketService.isConnected && selectedUser) {
        webSocketService.getMessageHistory(selectedUser);
      }
    };
  
    const pollUnread = () => {
      if (webSocketService.isConnected) {
        webSocketService.getUnreadMessages();
      }
    };
  
    const pollNotifications = () => {
      if (webSocketService.isConnected) {
        webSocketService.getNotifications();
      }
    };
  
    connectAndInitialize();
    webSocketService.addMessageListener(handleIncomingMessage);
  
    messageInterval = setInterval(pollMessages, 3000);
    unreadInterval = setInterval(pollUnread, 5000);
    notificationInterval = setInterval(pollNotifications, 5000);
  
    pollMessages();
    pollUnread();
    pollNotifications();
  
    return () => {
      clearInterval(messageInterval);
      clearInterval(unreadInterval);
      clearInterval(notificationInterval);
      webSocketService.removeMessageListener(handleIncomingMessage);
    };
  }, [user, handleIncomingMessage, selectedUser]);

  const handleChatSelect = useCallback((user) => {
    if (!user) {
      setSelectedUser(null);
      setMessages([]);
      return;
    }
  
    const chatUser = { ...user, type: user.type || 'private' };
    setSelectedUser(chatUser);
    setMessages([]);
  
    if (webSocketService.isConnected) {
      // This should properly handle both types already due to webSocketService implementation
      webSocketService.markMessagesAsRead(chatUser);
      webSocketService.getMessageHistory(chatUser);
    }
  }, []);

  const handleToggleChat = () => {
    setChatSidebarOpen(!isChatSidebarOpen);
    setNotificationSidebarOpen(false);
  };

  const handleToggleNotification = () => {
    setNotificationSidebarOpen(!isNotificationSidebarOpen);
    setChatSidebarOpen(false);
    
    if (!isNotificationSidebarOpen && webSocketService.isConnected) {
      webSocketService.getNotifications();
      setHasUnreadNotifications(false);
    }
  };

  const openChatFromNotification = (chatData) => {
    setNotificationSidebarOpen(false); 
    setChatSidebarOpen(true); 
    handleChatSelect(chatData);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        onToggleChat={handleToggleChat}
        onToggleNotification={handleToggleNotification}
        onLogout={() => webSocketService.disconnect()}
        hasUnreadMessages={hasUnreadMessages}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {isSidebarOpen && (
          <Box sx={{
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
          }}>
            <Sidebar />
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: isSidebarOpen ? `${drawerWidth}px` : 0,
            marginRight: isChatSidebarOpen || isNotificationSidebarOpen ? `${drawerWidth + 50}px` : '20px',
            padding: 3,
            bgcolor: '#121212',
            maxWidth: isChatSidebarOpen || isNotificationSidebarOpen ? '85%' : '90%',
            mx: 'auto',
            transition: 'margin 0.3s ease',
          }}
        >
          {children}
        </Box>

        {isChatSidebarOpen && (
          <Box sx={{
            width: drawerWidth + 50,
            flexShrink: 0,
            bgcolor: '#1f1f1f',
            color: 'white',
            position: 'fixed',
            right: 0,
            top: 64,
            bottom: 0,
          }}>
            <ChatSidebar
              onClose={() => setChatSidebarOpen(false)}
              onChatSelect={handleChatSelect}
              unreadCounts={unreadCounts}
              selectedUser={selectedUser}
              messages={messages}
              setMessages={setMessages}
            />
          </Box>
        )}

        {isNotificationSidebarOpen && (
          <Box sx={{
            width: drawerWidth + 50,
            flexShrink: 0,
            bgcolor: '#1f1f1f',
            color: 'white',
            position: 'fixed',
            right: 0,
            top: 64,
            bottom: 0,
          }}>
            <NotificationSidebar
              onClose={() => setNotificationSidebarOpen(false)}
              onHasUnreadNotificationsChange={setHasUnreadNotifications}
              notifications={notifications}
              setNotifications={setNotifications}
              onOpenChat={openChatFromNotification} 
            />  
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
}

export default MainLayout;
