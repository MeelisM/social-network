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
import { getOwnedGroups, inviteToGroup } from "../service/group";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { identifier } = useParams();
  const { user: loggedInUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [ownedGroups, setOwnedGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = loggedInUser?.user_id === identifier;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/users/posts?user_id=${identifier}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch user posts");
        const data = await res.json();
        setUserPosts(data || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, [identifier]);

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

    async function fetchProfileVisibility() {
      try {
        const res = await fetch(`http://localhost:8080/profile/visibility`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch profile visibility.");
        }
        const { is_public } = await res.json();
        setIsPublic(is_public);
      } catch (err) {
        console.error("Error fetching profile visibility:", err);
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
        // Check if logged-in user is following this profile
        setIsFollowing(data.some(follower => follower.id === loggedInUser?.user_id));
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
    if (isOwnProfile) fetchProfileVisibility();
    fetchFollowers();
    fetchFollowing();
    fetchOwnedGroups();
  }, [identifier, isOwnProfile, loggedInUser?.user_id]);

  const handleFollow = async () => {
    try {
      const res = await fetch(`http://localhost:8080/follow`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: identifier }),
      });
      if (!res.ok) {
        throw new Error("Error following user.");
      }
      setIsFollowing(true);
      setFollowers(prev => [...prev, loggedInUser]);
      alert("Followed successfully!");
    } catch (err) {
      console.error("Error following user:", err);
      alert("Failed to follow user.");
    }
  };

  const handleUnfollow = async () => {
    try {
      const res = await fetch(`http://localhost:8080/unfollow`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: identifier }),
      });
      if (!res.ok) {
        throw new Error("Error unfollowing user.");
      }
      setIsFollowing(false);
      setFollowers(prev => prev.filter(follower => follower.id !== loggedInUser?.user_id));
      alert("Unfollowed successfully!");
    } catch (err) {
      console.error("Error unfollowing user:", err);
      alert("Failed to unfollow user.");
    }
  };

  const handleInvite = async (groupId) => {
    setInviteLoading(true);
    try {
      await inviteToGroup(groupId, [user.id]);
      alert(`Invitation sent to ${user.username} for group ID: ${groupId}`);
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invite. Please try again.");
    } finally {
      setInviteLoading(false);
      setModalOpen(false);
    }
  };

  const toggleProfileType = async () => {
    try {
      const res = await fetch(`http://localhost:8080/users/visibility/update`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      if (!res.ok) {
        throw new Error("Error updating profile visibility.");
      }
      setIsPublic((prev) => !prev);
      alert(`Profile type changed to ${!isPublic ? "Public" : "Private"}`);
    } catch (err) {
      console.error("Error updating profile visibility:", err);
      alert("Failed to change profile visibility.");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Typography variant="h6" sx={{ color: "white", textAlign: "center", marginTop: 4 }}>
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

<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
  <Avatar
    sx={{
      width: 70,
      height: 70,
      backgroundColor: "#90caf9",
      fontSize: "1.5rem",
      fontWeight: "bold",
    }}
  >
    {/* Update the Avatar text to show initials */}
    {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()}
  </Avatar>
  <Box>
    <Typography
      variant="h5"
      sx={{
        color: "white",
        fontWeight: "bold",
        marginBottom: 1,
      }}
    >
      {/* Update the display name */}
      {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "No Name"}
    </Typography>
    {user.nickname && (
      <Typography
        variant="subtitle1"
        sx={{
          color: "#b0bec5",
        }}
      >
        @{user.nickname}
      </Typography>
    )}
  </Box>
</Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isOwnProfile && (
              <Button
                variant="contained"
                color={isFollowing ? "error" : "primary"}
                onClick={isFollowing ? handleUnfollow : handleFollow}
                sx={{
                  height: 40,
                  fontSize: "0.875rem",
                }}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <Button
                variant="contained"
                color="secondary"
                onClick={toggleProfileType}
                sx={{
                  height: 40,
                  fontSize: "0.875rem",
                }}
              >
                Set Profile {isPublic ? "Private" : "Public"}
              </Button>
            )}
          </Box>
        </Box>

        {/* About Me Section */}
        <Box
          sx={{
            margin: "0 auto",
            maxWidth: "900px",
            marginTop: 3,
            marginBottom: 4,
            padding: 2,
            backgroundColor: "#1f1f1f",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
            About Me
          </Typography>
          <Typography variant="body1" sx={{ color: "#b0bec5" }}>
            {user.about_me || "No about me information available."}
          </Typography>
        </Box>

        {/* User Posts Section */}
        <Box
          sx={{
            margin: "0 auto",
            maxWidth: "900px",
            marginBottom: 4,
          }}
        >
          <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
            Posts
          </Typography>
          <Grid container spacing={2}>
            {userPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Paper
                  sx={{
                    padding: 2,
                    backgroundColor: "#1f1f1f",
                    color: "#ffffff",
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="body1" sx={{ color: "#b0bec5" }}>
                    {post.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#808080", display: "block", marginTop: 1 }}
                  >
                    {new Date(post.created_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {userPosts.length === 0 && (
              <Grid item xs={12}>
                <Typography sx={{ color: "#b0bec5" }}>
                  No posts yet.
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

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
                    key={follower.id}
                    sx={{
                      fontSize: "0.95rem",
                      color: "#b0bec5",
                      marginBottom: 1,
                    }}
                  >
                    {`${follower.first_name} ${follower.last_name}`.trim()}
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
                    key={followed.id}
                    sx={{
                      fontSize: "0.95rem",
                      color: "#b0bec5",
                      marginBottom: 1,
                    }}
                  >
                    {`${followed.first_name} ${followed.last_name}`.trim()}
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
