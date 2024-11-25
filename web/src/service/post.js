import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const createPost = async (postData) => {
  try {
    const formData = new FormData();
    formData.append('content', postData.content);
    formData.append('privacy', postData.privacy);
    formData.append('group', postData.group);

    if (postData.privacy === "almost_private") {
      formData.append('viewerIDs', JSON.stringify(postData.viewers));
    }

    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await axios.post(`${API_BASE_URL}/posts`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error.message);
    throw error;
  }
};

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

const updatePost = async (postId, updateData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/posts/${postId}`, updateData, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error.response?.data || error.message);
    throw error;
  }
};

const deletePost = async (postId, imagePath) => {
  try {
    await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
      withCredentials: true,
    });
    if (imagePath) {
      await imageService.deleteImage(imagePath);
    }
  } catch (error) {
    console.error("Error deleting post:", error.response?.data || error.message);
    throw error;
  }
};

const createComment = async (postId, commentData) => {
  try {
    const formData = new FormData();
    formData.append('content', commentData.content);

    if (commentData.image) {
      formData.append('image', commentData.image);
    }

    const response = await axios.post(
      `${API_BASE_URL}/posts/${postId}/comments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error.response?.data || error.message);
    throw error;
  }
};

const updateComment = async (postId, commentId, updateData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/posts/${postId}/comments/${commentId}`,
      { content: updateData.content },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating comment:", error.response?.data || error.message);
    throw error;
  }
};

const deleteComment = async (postId, commentId, imagePath) => {
  try {
    await axios.delete(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
      withCredentials: true,
    });
    if (imagePath) {
      await imageService.deleteImage(imagePath);
    }
  } catch (error) {
    console.error("Error deleting comment:", error.response?.data || error.message);
    throw error;
  }
};

const getComments = async (postId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/posts/${postId}/comments`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching comments:", error.response?.data || error.message);
    throw error;
  }
};

export default {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
  getComments,
};
