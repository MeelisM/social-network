import React, { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

function ChatApp() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      {selectedUser ? (
        <ChatWindow
          user={selectedUser}
          onBack={() => setSelectedUser(null)} // Deselect the user to return to the sidebar
        />
      ) : (
        <ChatSidebar
          onClose={() => console.log('Sidebar closed')} // Optional close action
          onSelectUser={(user) => setSelectedUser(user)} // Set the selected user
        />
      )}
    </>
  );
}

export default ChatApp;
s