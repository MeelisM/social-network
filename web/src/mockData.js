const users = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      avatar: 'https://via.placeholder.com/150?text=John',
      nickname: 'johndoe',
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      avatar: 'https://via.placeholder.com/150?text=Jane',
      nickname: 'janesmith',
    },
  ];
  
  // Posts with associated posters
  const posts = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    title: `Post Title ${index + 1}`,
    content: `This is the content of post number ${index + 1}.`,
    image: index % 3 === 0 ? `https://via.placeholder.com/150?text=Image+${index + 1}` : null,
    poster: users[index % users.length], // Cycle through users for posters
  }));
  
  const followers = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Follower ${index + 1}`,
  }));
  
  const groups = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Group ${index + 1}`,
  }));
  
  // Mock notifications
  const notifications = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    text: `Notification ${index + 1}`,
    timestamp: new Date(Date.now() - index * 60000).toLocaleTimeString(), 
  }));
  
  export { posts, followers, groups, users, notifications };
  