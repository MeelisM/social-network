export const handleWebSocketNotifications = (
    user,
    webSocketService,
    handleIncomingNotification
  ) => {
    if (!user) return { cleanup: () => {} };
  
    let notificationInterval;
  
    const connectAndInitialize = () => {
      if (!webSocketService.isConnected && !webSocketService.isConnecting) {
        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}/ws?token=${localStorage.getItem('token')}`;
        webSocketService.connect(wsUrl);
      }
    };
  
    const pollNotifications = () => {
      if (webSocketService.isConnected) {
        webSocketService.getNotifications();
      }
    };
  
    connectAndInitialize();
    webSocketService.addMessageListener(handleIncomingNotification);
  
    // Poll for new notifications
    notificationInterval = setInterval(pollNotifications, 5000);
    pollNotifications(); // Initial poll
  
    return {
      cleanup: () => {
        clearInterval(notificationInterval);
        webSocketService.removeMessageListener(handleIncomingNotification);
      }
    };
  };
  
  export const handleNotificationProcessing = (
    message,
    setNotifications,
    setHasUnreadNotifications
  ) => {
    if (message.type === "notifications_list") {
      handleNotificationsList(message, setNotifications, setHasUnreadNotifications);
    } else if (message.type === "new_notification") {
      handleNewNotification(message, setNotifications, setHasUnreadNotifications);
    }
  };
  
  const handleNotificationsList = (message, setNotifications, setHasUnreadNotifications) => {
    const notifications = message.content.notifications || [];
    setNotifications(notifications);
    const hasUnread = notifications.some(notification => !notification.read);
    setHasUnreadNotifications(hasUnread);
  };
  
  const handleNewNotification = (message, setNotifications, setHasUnreadNotifications) => {
    const newNotification = message.content;
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      const hasUnread = updated.some(notification => !notification.read);
      setHasUnreadNotifications(hasUnread);
      return updated;
    });
  };
  
  export const formatNotificationTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };