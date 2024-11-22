import React from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import PostForm from "../components/PostForm";
import MainLayout from "../layouts/MainLayout";
import { useAxios } from "../utils/axiosInstance";

function NewPostPage() {
  const axios = useAxios();
  const navigate = useNavigate();

  const handleSubmit = async (postData) => {
    const formData = new FormData();
    formData.append("content", postData.content);
    formData.append("privacy", postData.privacy);
    if (postData.image) {
      formData.append("image", postData.image);
    }
    if (postData.privacy === "almost_private") {
      formData.append("viewers", JSON.stringify(postData.viewers));
    }

    try {
      await axios.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/main");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ padding: 4 }}>
        <PostForm onSubmit={handleSubmit} />
      </Box>
    </MainLayout>
  );
}

export default NewPostPage;
