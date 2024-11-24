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
  const { user } = useAuth();

  // Listener for incoming messages
  const handleIncomingMessage = useCallback((message) => {
    if (!user) return;

    console.log('Received message:', message);

    if (message.type === "new_private_message") {
      const senderId = message.content.sender_id;
      const recipientId = message.content.recipient_id;

      // If it's a message for current chat
      if (
        selectedUser?.type === "private" &&
        (selectedUser.id === senderId || selectedUser.id === recipientId)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            ...message.content,
            isSent: senderId === user.user_id,
          },
        ]);
      }
      // If we're the recipient and it's not current chat
      else if (recipientId === user.user_id) {
        setUnreadCounts((prev) => {
          const count = prev[senderId] || 0;
          const newCounts = { ...prev, [senderId]: count + 1 };
          const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
          setHasUnreadMessages(totalUnread > 0);
          return newCounts;
        });
      }
    } else if (message.type === "unread_messages") {
      const senderList = Array.isArray(message.content.senders) ? message.content.senders : [];
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        senderList.forEach((senderId) => {
          if (senderId) newCounts[senderId] = 1;
        });
        const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
        setHasUnreadMessages(totalUnread > 0);
        return newCounts;
      });
    } else if (message.type === "private_message_history") {
      if (selectedUser?.type === "private") {
        const messagesArray = [
          ...(message.content.sent || []),
          ...(message.content.received || []),
        ];
        const data = messagesArray.map((msg) => ({
          ...msg,
          isSent: msg.sender_id === user.user_id,
        }));
        data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(data);
      }
    }
  }, [user, selectedUser]);

  // Handle WebSocket connection and message polling
  useEffect(() => {
    if (!user) return;

    let messageInterval;
    let unreadInterval;

    const connectAndInitialize = () => {
      if (!webSocketService.isConnected && !webSocketService.isConnecting) {
        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${localStorage.getItem(
          'token'
        )}`;
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

    connectAndInitialize();
    webSocketService.addMessageListener(handleIncomingMessage);

    // Set up polling intervals
    messageInterval = setInterval(pollMessages, 3000); // Poll every 3 seconds for new messages
    unreadInterval = setInterval(pollUnread, 5000); // Poll every 5 seconds for unread messages

    // Initial polls
    pollMessages();
    pollUnread();

    return () => {
      clearInterval(messageInterval);
      clearInterval(unreadInterval);
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
    setMessages([]); // Clear messages when switching chats

    // Clear unread count for this chat
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[user.id];
      const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setHasUnreadMessages(totalUnread > 0);
      return newCounts;
    });

    // Mark messages as read and fetch message history
    if (webSocketService.isConnected) {
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
    if (!isNotificationSidebarOpen) {
      setHasUnreadNotifications(false);
    }
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
              selectedUser={selectedUser}
              messages={messages}
              setMessages={setMessages}
            />
          </Box>
        )}

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
              onHasUnreadNotificationsChange={setHasUnreadNotifications}
            />
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
}

export default MainLayout;
