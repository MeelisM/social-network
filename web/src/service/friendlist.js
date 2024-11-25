import axios from 'axios';

export const getFriendList = async () => {
  try {
    // Fetch followers and following
    const [followersResponse, followingResponse] = await Promise.all([
      axios.get('http://localhost:8080/followers', { withCredentials: true }),
      axios.get('http://localhost:8080/following', { withCredentials: true }),
    ]);

    // Extract the data from responses
    const followers = Array.isArray(followersResponse.data) ? followersResponse.data : [];
    const following = Array.isArray(followingResponse.data) ? followingResponse.data : [];

    // Match users by ID to find mutual connections and add displayName
    const friends = following.filter((user) =>
      followers.some((follower) => follower.id === user.id)
    ).map(user => ({
      ...user,
      displayName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.nickname || 'Unknown User'
    }));

    return friends;
  } catch (error) {
    console.error('Error fetching friend list:', error.message);
    return [];
  }
};
