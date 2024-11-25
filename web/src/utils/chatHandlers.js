export const handleWebSocketSetup = (
    user,
    selectedUser,
    webSocketService,
    handleIncomingMessage
  ) => {
    if (!user) return { cleanup: () => {} };
  
    let messageInterval;
    let unreadInterval;
  
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
  
    connectAndInitialize();
    webSocketService.addMessageListener(handleIncomingMessage);
  
    messageInterval = setInterval(pollMessages, 3000);
    unreadInterval = setInterval(pollUnread, 5000);
  
    pollMessages();
    pollUnread();
  
    return {
      cleanup: () => {
        clearInterval(messageInterval);
        clearInterval(unreadInterval);
        webSocketService.removeMessageListener(handleIncomingMessage);
      }
    };
  };
  
  export const handleMessageProcessing = (
    message,
    user,
    selectedUser,
    isChatSidebarOpen,
    webSocketService,
    setMessages,
    setUnreadCounts,
    setHasUnreadMessages
  ) => {
    if (message.type === "private_message_history") {
      handlePrivateMessageHistory(message, selectedUser, user, setMessages);
    } else if (message.type === "group_message_history") {
      handleGroupMessageHistory(message, selectedUser, user, setMessages);
    } else if (message.type === "new_private_message") {
      handleNewPrivateMessage(
        message,
        selectedUser,
        user,
        isChatSidebarOpen,
        webSocketService,
        setMessages,
        setUnreadCounts,
        setHasUnreadMessages
      );
    } else if (message.type === "new_group_message") {
      handleNewGroupMessage(
        message,
        selectedUser,
        user,
        setMessages,
        setUnreadCounts,
        setHasUnreadMessages
      );
    } else if (message.type === "unread_messages") {
      handleUnreadMessages(
        message,
        selectedUser,
        isChatSidebarOpen,
        setUnreadCounts,
        setHasUnreadMessages
      );
    }
  };
  
  const handlePrivateMessageHistory = (message, selectedUser, user, setMessages) => {
    if (selectedUser?.type === "private") {
      const messagesArray = [...(message.content.sent || []), ...(message.content.received || [])];
      const data = messagesArray.map((msg) => ({
        ...msg,
        isSent: msg.sender_id === user.user_id,
      }));
      data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(data);
    }
  };
  
  const handleGroupMessageHistory = (message, selectedUser, user, setMessages) => {
    if (selectedUser?.type === "group" && selectedUser.id === message.content.group_id) {
      const messagesArray = Array.isArray(message.content) ? message.content : [];
      const data = messagesArray.map((msg) => ({
        ...msg,
        isSent: msg.sender_id === user.user_id,
      }));
      data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(data);
    }
  };
  
  const handleNewPrivateMessage = (
    message,
    selectedUser,
    user,
    isChatSidebarOpen,
    webSocketService,
    setMessages,
    setUnreadCounts,
    setHasUnreadMessages
  ) => {
    const { sender_id, recipient_id } = message.content;
  
    if (selectedUser?.type === "private") {
      const isRelevantMessage =
        (sender_id === selectedUser.id && recipient_id === user.user_id) ||
        (sender_id === user.user_id && recipient_id === selectedUser.id);
  
      if (isRelevantMessage) {
        const newMsg = {
          ...message.content,
          isSent: sender_id === user.user_id,
        };
        setMessages((prev) => [...prev, newMsg]);
  
        if (isChatSidebarOpen && !newMsg.isSent && webSocketService.isConnected) {
          webSocketService.markMessagesAsRead(selectedUser);
        }
      }
    }
  
    if (recipient_id === user.user_id && 
       (!selectedUser || selectedUser.id !== sender_id || !isChatSidebarOpen)) {
      updateUnreadCounts(sender_id, setUnreadCounts, setHasUnreadMessages);
    }
  };
  
  const handleNewGroupMessage = (
    message,
    selectedUser,
    user,
    setMessages,
    setUnreadCounts,
    setHasUnreadMessages
  ) => {
    const { group_id, sender_id } = message.content;
  
    if (selectedUser?.type === "group" && selectedUser.id === group_id) {
      const newMsg = {
        ...message.content,
        isSent: sender_id === user.user_id,
      };
      setMessages((prev) => [...prev, newMsg]);
    } else {
      updateUnreadCounts(group_id, setUnreadCounts, setHasUnreadMessages);
    }
  };
  
  const handleUnreadMessages = (
    message,
    selectedUser,
    isChatSidebarOpen,
    setUnreadCounts,
    setHasUnreadMessages
  ) => {
    const senderList = Array.isArray(message.content.senders) ? message.content.senders : [];
    
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      senderList.forEach((senderId) => {
        if (!selectedUser || selectedUser.id !== senderId || !isChatSidebarOpen) {
          newCounts[senderId] = 1;
        }
      });
      const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setHasUnreadMessages(totalUnread > 0);
      return newCounts;
    });
  };
  
  const updateUnreadCounts = (id, setUnreadCounts, setHasUnreadMessages) => {
    setUnreadCounts((prev) => {
      const count = prev[id] || 0;
      const newCounts = { ...prev, [id]: count + 1 };
      const totalUnread = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setHasUnreadMessages(totalUnread > 0);
      return newCounts;
    });
  };