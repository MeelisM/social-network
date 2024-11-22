import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

// Function to create a post
const createPost = async (postData) => {
  try {
    const payload = {
      content: postData.content,
      imagePath: postData.image ? URL.createObjectURL(postData.image) : null,
      privacy: postData.privacy,
      viewerIDs: postData.privacy === "almost_private" ? postData.viewers : [],
      group: postData.group,
    };

    const response = await axios.post(`${API_BASE_URL}/posts`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error.message);
    throw error;
  }
};

// Function to get public posts
const getPosts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/posts/public`, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error.response?.data || error.message);
    throw error;
  }
};

export default {
  createPost,
  getPosts,
};
