import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  Button,
  Modal,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { getOwnedGroups, inviteToGroup } from "../service/groupService";
import MainLayout from "../layouts/MainLayout";

function ProfilePage() {
  const { identifier } = useParams(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [ownedGroups, setOwnedGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`http://localhost:8080/users/${identifier}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Error fetching user profile: ${res.statusText}`);
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchFollowers() {
      try {
        const res = await fetch(
          `http://localhost:8080/followers?user_id=${identifier}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`Error fetching followers: ${res.statusText}`);
        }
        const data = await res.json();
        setFollowers(data || []);
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchFollowing() {
      try {
        const res = await fetch(
          `http://localhost:8080/following?user_id=${identifier}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`Error fetching following: ${res.statusText}`);
        }
        const data = await res.json();
        setFollowing(data || []);
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchOwnedGroups() {
      try {
        const response = await getOwnedGroups();
        setOwnedGroups(
          Array.isArray(response?.data?.owned_groups)
            ? response.data.owned_groups
            : []
        );
      } catch (error) {
        console.error("Error fetching owned groups:", error);
      }
    }

    fetchUser();
    fetchFollowers();
    fetchFollowing();
    fetchOwnedGroups();
  }, [identifier]);

  const handleInvite = async (groupId) => {
    setInviteLoading(true);
    try {
      await inviteToGroup(groupId, [user.id]);
      alert(`Invitation sent to ${user.nickname} for group ID: ${groupId}`);
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invite. Please try again.");
    } finally {
      setInviteLoading(false);
      setModalOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Typography
          variant="h6"
          sx={{
            color: "white",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          Loading profile...
        </Typography>
      </MainLayout>
    );
  }

  if (error || !user) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: "center", padding: 4 }}>
          <Typography variant="h5" color="error">
            {error || "User not found!"}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ padding: 4 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginBottom: 6,
            maxWidth: "900px",
            margin: "0 auto",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={user.avatar}
              alt={user.nickname}
              sx={{ width: 70, height: 70, marginRight: 3 }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "white",
                fontWeight: "bold",
              }}
            >
              {user.nickname}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setModalOpen(true)}
            disabled={inviteLoading}
            sx={{
              height: 40,
              fontSize: "0.875rem",
            }}
          >
            Invite to Group
          </Button>
        </Box>

        {/* About Section */}
        <Grid
          container
          spacing={4}
          sx={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <Grid item xs={12}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: "#1f1f1f",
                color: "#ffffff",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                About Me
              </Typography>
              <Typography variant="body1">
                {user.about_me || "No information provided."}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Followers and Following */}
        <Grid
          container
          spacing={4}
          sx={{
            marginTop: 4,
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <Grid item xs={6}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: "#1f1f1f",
                color: "#ffffff",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Followers
              </Typography>
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <Typography
                    key={follower.id || follower.nickname}
                    sx={{
                      fontSize: "0.95rem",
                      color: "#b0bec5",
                      marginBottom: 1,
                    }}
                  >
                    {follower.nickname || "Unknown"}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
                  No followers.
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: "#1f1f1f",
                color: "#ffffff",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Following
              </Typography>
              {following.length > 0 ? (
                following.map((followed) => (
                  <Typography
                    key={followed.id || followed.nickname}
                    sx={{
                      fontSize: "0.95rem",
                      color: "#b0bec5",
                      marginBottom: 1,
                    }}
                  >
                    {followed.nickname || "Unknown"}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
                  Not following anyone.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Modal for Group Invitation */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{
            padding: 4,
            width: "400px",
            backgroundColor: "#1f1f1f",
            color: "#ffffff",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Select a Group
          </Typography>
          {ownedGroups.length === 0 ? (
            <Typography>No groups available for invitation.</Typography>
          ) : (
            <List>
              {ownedGroups.map((group) => (
                <ListItem
                  button
                  key={group.id}
                  onClick={() => handleInvite(group.id)}
                >
                  <ListItemText
                    primary={group.title}
                    secondary={group.description || "No description"}
                    sx={{ color: "white" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {inviteLoading && (
            <CircularProgress
              size={24}
              sx={{
                color: "white",
                marginTop: 2,
                display: "block",
                margin: "0 auto",
              }}
            />
          )}
        </Paper>
      </Modal>
    </MainLayout>
  );
}

export default ProfilePage;
