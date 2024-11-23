import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  getGroupDetails,
  getGroupPosts,
  getGroupEvents,
  getGroupMembers,
} from "../service/groupService";
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
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <CircularProgress sx={{ color: "white", display: "block", margin: "auto" }} />
      </MainLayout>
    );
  }

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
        {/* Group Header */}
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", marginBottom: 4 }}
        >
          {groupDetails?.title || "Group Title"}
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 6 }}>
          {groupDetails?.description || "No description available."}
        </Typography>

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
