import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import {
  getGroupDetails,
  getGroupPosts,
  getGroupEvents,
  getGroupMembers,
} from "../service/group";
import MainLayout from "../layouts/MainLayout";
import Event from "../components/group/Event";
import Member from "../components/group/Member"; 
import Post from "../components/group/Post"; 

const GroupPage = () => {
  const { id } = useParams(); 
  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupResponse = await getGroupDetails(id);
        setGroupDetails(groupResponse.data);

        const postsResponse = await getGroupPosts(id);
        setPosts(postsResponse.data || []); 

        const eventsResponse = await getGroupEvents(id);
        setEvents(eventsResponse.data || []); 

        const membersResponse = await getGroupMembers(id);
        setMembers(membersResponse.data || []); 
      } catch (error) {
        console.error("Error fetching group data:", error);
        setError(error.response?.data?.message || "Failed to fetch group data.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <CircularProgress sx={{ color: "white" }} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: "center", padding: 4 }}>
          <Alert severity="error" sx={{ backgroundColor: "#2f1f1f", color: "#ff8a80" }}>
            {error}
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  if (!groupDetails) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: "center", padding: 4, marginTop: 8 }}>
          <Typography variant="h5" color="error">
            Group not found!
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  console.log("Group Details:", groupDetails); 

  return (
    <MainLayout>
      <Box
        sx={{
          padding: 4,
          maxWidth: "900px",
          margin: "0 auto",
          color: "white",
        }}
      >

        {/* Members Section */}
        <Member members={members} /> {/* Use Member Component */}

        {/* Posts Section */}
        <Post groupId={id} posts={posts} setPosts={setPosts} /> {/* Use Post Component */}

        {/* Events Section */}
        <Typography variant="h5" sx={{ marginTop: 6, marginBottom: 2 }}>
          Events
        </Typography>
        <Event groupId={id} events={events} setEvents={setEvents} />
      </Box>
    </MainLayout>
  );
};

export default GroupPage;
