import axios from "axios";
import imageService from "./giphy.js";


const API_BASE_URL = "http://localhost:8080";

const createPost = async (postData) => {
  try {
    const payload = {
      content: postData.content,
      gifUrl: postData.gif?.url,
      privacy: postData.privacy,
      viewerIDs: postData.privacy === "almost_private" ? postData.viewers : [],
      group: postData.group,
    };

    const response = await axios.post(`${API_BASE_URL}/posts`, payload, {
      headers: { "Content-Type": "application/json" },
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

// Updated to match backend route structure
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

// Updated to match backend route structure
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

// Updated to match backend route structure
const createComment = async (postId, commentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/posts/${postId}/comments`,
      { 
        content: commentData.content,
        gifUrl: commentData.gif?.url
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error.response?.data || error.message);
    throw error;
  }
};

// This endpoint doesn't exist in your backend routes - you'll need to remove it or add the route
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

// Updated to match backend route structure
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

// Add this method to fetch comments for a post
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