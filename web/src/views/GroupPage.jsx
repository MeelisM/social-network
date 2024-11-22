import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Modal,
} from "@mui/material";
import {
  getGroupDetails,
  getGroupPosts,
  createGroupPost,
  getGroupEvents,
  createGroupEvent,
  getGroupMembers,
} from "../service/groupService";
import MainLayout from "../layouts/MainLayout";

const GroupPage = () => {
  const { id } = useParams(); 
  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [newEvent, setNewEvent] = useState({ title: "", description: "", eventTime: "" });

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

  const formatDateForBackend = (date) => {
    return date.toISOString(); 
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try {
      const currentTime = formatDateForBackend(new Date());

      const payload = {
        content: newPost,
        createdAt: currentTime,
      };

      console.log("Post payload:", payload); 

      const response = await createGroupPost(id, payload);

      setPosts((prevPosts) => [response.data, ...prevPosts]);
      setNewPost(""); 
      setPostModalOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.eventTime.trim()) return;
    try {
      const eventTime = formatDateForBackend(new Date(newEvent.eventTime));

      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        event_time: eventTime,
      };

      console.log("Event payload:", payload);

      const response = await createGroupEvent(id, payload);

      setEvents((prevEvents) => [response.data, ...prevEvents]);
      setNewEvent({ title: "", description: "", eventTime: "" }); 
      setEventModalOpen(false); 
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

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
        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          Members
        </Typography>
        <Grid container spacing={2} sx={{ marginBottom: 4 }}>
          {members?.length > 0 ? (
            members.map((member) => (
              <Grid item xs={12} sm={6} key={member.user_id}>
                <Paper
                  sx={{
                    padding: 2,
                    backgroundColor: "#333",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  {`${member.first_name} ${member.last_name}`} <br />
                  <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                    {member.email}
                  </Typography>
                </Paper>
              </Grid>
            ))
          ) : (
            <Typography>No members yet.</Typography>
          )}
        </Grid>

        {/* Posts Section */}
        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          Posts
        </Typography>
        <Button
          variant="contained"
          onClick={() => setPostModalOpen(true)}
          sx={{
            backgroundColor: "#1f1f1f",
            color: "white",
            marginBottom: 3,
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          + Create Post
        </Button>
        {posts?.length > 0 ? (
          posts.map((post) => (
            <Paper
              key={post.id}
              sx={{
                padding: 2,
                marginBottom: 2,
                backgroundColor: "#1f1f1f",
              }}
            >
              <Typography variant="body1">{post.content}</Typography>
              <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                {new Date(post.createdAt).toLocaleString()}
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography>No posts yet.</Typography>
        )}

        {/* Events Section */}
        <Typography variant="h5" sx={{ marginTop: 6, marginBottom: 2 }}>
          Events
        </Typography>
        <Button
          variant="contained"
          onClick={() => setEventModalOpen(true)}
          sx={{
            backgroundColor: "#1f1f1f",
            color: "white",
            marginBottom: 3,
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          + Create Event
        </Button>
        {events?.length > 0 ? (
          events.map((event) => (
            <Paper
              key={event.id}
              sx={{
                padding: 2,
                marginBottom: 2,
                backgroundColor: "#1f1f1f",
              }}
            >
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2">{event.description}</Typography>
              <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                Scheduled for {new Date(event.event_time).toLocaleString()}
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography>No events yet.</Typography>
        )}
      </Box>

      {/* Post Modal */}
      <Modal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper sx={{ padding: 4, backgroundColor: "#1f1f1f", width: "400px" }}>
          <Typography variant="h5" sx={{ marginBottom: 3 }}>
            Create New Post
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Write your post..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{
              marginBottom: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#b0bec5" },
                "&:hover fieldset": { borderColor: "white" },
              },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreatePost}
            sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#555" } }}
          >
            Create Post
          </Button>
        </Paper>
      </Modal>

      {/* Event Modal */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper sx={{ padding: 4, backgroundColor: "#1f1f1f", width: "400px" }}>
          <Typography variant="h5" sx={{ marginBottom: 3 }}>
            Create New Event
          </Typography>
          <TextField
            fullWidth
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            type="datetime-local"
            fullWidth
            value={newEvent.eventTime || ""}
            onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
            sx={{ marginBottom: 3 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Event Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            sx={{ marginBottom: 3 }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateEvent}
            sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#555" } }}
          >
            Create Event
          </Button>
        </Paper>
      </Modal>
    </MainLayout>
  );
};

export default GroupPage;
