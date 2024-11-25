import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { getOwnedGroups, inviteToGroup } from "../service/group";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import ProfileHeader from "../components/profile/ProfileHeader";
import AboutSection from "../components/profile/AboutSection";
import UserPosts from "../components/profile/UserPosts";
import ConnectionsList from "../components/profile/ConnectionsList";
import GroupInviteModal from "../components/profile/GroupInviteModal";

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
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data first
        const userRes = await fetch(`http://localhost:8080/users/${identifier}`, {
          credentials: "include",
        });
        if (!userRes.ok) {
          throw new Error(`Error fetching user profile: ${userRes.statusText}`);
        }
        const userData = await userRes.json();
        setUser(userData);
        // Set visibility from user data
        setIsPublic(userData.is_public);

        // If it's own profile, double-check with visibility endpoint
        if (isOwnProfile) {
          try {
            const visibilityRes = await fetch(`http://localhost:8080/profile/visibility`, {
              credentials: "include",
            });
            if (visibilityRes.ok) {
              const { is_public } = await visibilityRes.json();
              setIsPublic(is_public); // This will override the previous value if different
            }
          } catch (error) {
            console.error("Error fetching profile visibility:", error);
          }
        }

        const followersRes = await fetch(
          `http://localhost:8080/followers?user_id=${identifier}`,
          {
            credentials: "include",
          }
        );
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          // Add null check and ensure it's an array
          const followersArray = Array.isArray(followersData) ? followersData : [];
          setFollowers(followersArray);
          // Add null check for loggedInUser as well
          if (loggedInUser?.user_id) {
            setIsFollowing(followersArray.some(follower => follower.id === loggedInUser.user_id));
          }
        }

        // Fetch following
        const followingRes = await fetch(
          `http://localhost:8080/following?user_id=${identifier}`,
          {
            credentials: "include",
          }
        );
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowing(followingData || []);
        }

        // Fetch owned groups
        const groupsResponse = await getOwnedGroups();
        setOwnedGroups(
          Array.isArray(groupsResponse?.data?.owned_groups)
            ? groupsResponse.data.owned_groups
            : []
        );

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      alert(`Invitation sent to ${user.first_name} ${user.last_name} for group ID: ${groupId}`);
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
      const newVisibility = !isPublic;
      
      const res = await fetch(`http://localhost:8080/users/visibility/update`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_public: newVisibility }),
      });
      
      if (!res.ok) {
        throw new Error("Error updating profile visibility.");
      }
      
      // Update both user and isPublic state
      setIsPublic(newVisibility);
      setUser(prev => ({
        ...prev,
        is_public: newVisibility
      }));
      
      alert(`Profile is now ${newVisibility ? "Public" : "Private"}`);
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
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          isPublic={isPublic}
          isFollowing={isFollowing}
          onToggleProfileType={toggleProfileType}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onOpenInviteModal={() => setModalOpen(true)}
        />
        
        <AboutSection user={user} />  {/* Changed this line */}
        
        <UserPosts posts={userPosts} />
        
        <ConnectionsList
          followers={followers}
          following={following}
        />
        
        <GroupInviteModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          groups={ownedGroups}
          onInvite={handleInvite}
          loading={inviteLoading}
        />
      </Box>
    </MainLayout>
  );
}

export default ProfilePage;