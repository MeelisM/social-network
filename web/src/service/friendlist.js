import axios from 'axios';

export const getFriendList = async () => {
  try {
    // Fetch followers and following
    const [followersResponse, followingResponse] = await Promise.all([
      axios.get('http://localhost:8080/followers', { withCredentials: true }),
      axios.get('http://localhost:8080/following', { withCredentials: true }),
    ]);

    // Debug the responses
    console.log('Followers response:', followersResponse.data);
    console.log('Following response:', followingResponse.data);

    // Extract the data from responses
    const followers = Array.isArray(followersResponse.data) ? followersResponse.data : [];
    const following = Array.isArray(followingResponse.data) ? followingResponse.data : [];

    // Log parsed data
    console.log('Parsed Followers:', followers);
    console.log('Parsed Following:', following);

    // Match users by ID to find mutual connections
    const friends = following.filter((user) =>
      followers.some((follower) => follower.id === user.id)
    );

    console.log('Friends:', friends); // Debug mutual friends
    return friends;
  } catch (error) {
    console.error('Error fetching friend list:', error.message);
    return [];
  }
};
