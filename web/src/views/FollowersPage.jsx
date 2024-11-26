import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PleaseLoginOrRegister from "../components/utils/PleaseLoginOrRegister";
import FollowRequests from "../components/follower/FollowRequests";
import FollowList from "../components/follower/FollowList";

const formatFullName = (user) => {
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`.trim() || user.nickname || "Unknown User";
};

function FollowersPage() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchData = async (url, setter) => {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!res.ok) {
        throw new Error(`Error fetching data from ${url}: ${res.statusText}`);
      }
      const data = await res.json();
      const transformedData = (data || []).map(user => ({
        ...user,
        displayName: formatFullName(user)
      }));
      setter(transformedData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    async function fetchAllData() {
      try {
        const pendingRes = await fetch("http://localhost:8080/follow/pending", {
          credentials: "include",
        });
        if (pendingRes.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!pendingRes.ok) {
          throw new Error("Failed to fetch pending follow requests");
        }
        const pendingRequests = await pendingRes.json() || []; // Ensure it's an array
        // Transform pending requests to include displayName
        const transformedRequests = pendingRequests.map(request => ({
          ...request,
          displayName: formatFullName(request)
        }));
        setFollowRequests(transformedRequests);

        await Promise.all([
          fetchData("http://localhost:8080/followers", setFollowers),
          fetchData("http://localhost:8080/following", setFollowing),
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  if (unauthorized) {
    return <PleaseLoginOrRegister />;
  }

  if (loading) {
    return (
      <MainLayout>
        <Typography variant="h6" sx={{ color: "white", textAlign: "center", marginTop: 4 }}>
          Loading data...
        </Typography>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Typography variant="h6" sx={{ color: "red", textAlign: "center", marginTop: 4 }}>
          {error}
        </Typography>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ padding: 4, maxWidth: "1400px", margin: "0 auto" }}>
        <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
          Follow Requests
        </Typography>
        <FollowRequests 
          followRequests={followRequests} 
          setFollowRequests={setFollowRequests} 
          setFollowers={setFollowers} 
        />
        <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
          Followers
        </Typography>
        <FollowList 
          data={followers} 
          emptyMessage="You have no followers yet." 
        />
        <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
          Following
        </Typography>
        <FollowList 
          data={following} 
          emptyMessage="You are not following anyone yet." 
        />
      </Box>
    </MainLayout>
  );
}

export default FollowersPage;
