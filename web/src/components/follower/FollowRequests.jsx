import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, Paper, Button, CircularProgress } from "@mui/material";

const FollowRequests = ({ followRequests: initialFollowRequests, setFollowRequests, setFollowers }) => {
  const [enrichedRequests, setEnrichedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return `http://localhost:8080${avatarPath}`;
  };

  const getInitials = (user) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserDetails = async () => {
      if (initialFollowRequests.length === 0) {
        setLoading(false);
        setEnrichedRequests([]);
        return;
      }

      try {
        setLoading(true);
        const enrichedData = await Promise.all(
          initialFollowRequests.map(async (request) => {
            try {
              const res = await fetch(`http://localhost:8080/users/${request.follower_id}`, {
                credentials: "include"
              });

              if (!res.ok) {
                throw new Error(`Failed to fetch user details for ${request.follower_id}`);
              }

              const userData = await res.json();
              return {
                ...userData, 
                ...request,   
                displayName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unknown User'
              };
            } catch (error) {
              console.error(`Error fetching details for user ${request.follower_id}:`, error);
              return {
                ...request,
                displayName: 'Unknown User',
                first_name: '',
                last_name: ''
              };
            }
          })
        );

        if (isMounted) {
          setEnrichedRequests(enrichedData);
          console.log("Enriched Requests:", enrichedData); 
        }
      } catch (error) {
        console.error("Error enriching follow requests:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserDetails();

    return () => {
      isMounted = false;
    };
  }, [initialFollowRequests]); 

  const respondToRequest = async (requestID, accept) => {
    try {
      console.log(`Responding to request ID: ${requestID}, Accept: ${accept}`); 
      const res = await fetch("http://localhost:8080/follow/respond", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestID, accept }),
      });

      console.log(`Response status: ${res.status}`); 
      if (!res.ok) {
        console.error("Failed to respond to follow request:", res.status, res.statusText);
        return;
      }

      const newRequests = enrichedRequests.filter((request) => request.id !== requestID);
      setEnrichedRequests(newRequests);
      setFollowRequests(newRequests);

      if (accept) {
        const acceptedUser = enrichedRequests.find((req) => req.id === requestID);
        if (acceptedUser) {
          setFollowers((prev) => [
            ...prev,
            {
              id: acceptedUser.follower_id,
              first_name: acceptedUser.first_name,
              last_name: acceptedUser.last_name,
              displayName: acceptedUser.displayName,
            },
          ]);
        } else {
          console.error(`Accepted user with request ID ${requestID} not found.`);
        }
      }
    } catch (err) {
      console.error("Error responding to follow request:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "200px" 
      }}>
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3, marginBottom: 6 }}>
      {enrichedRequests.length > 0 ? (
        enrichedRequests.map((request) => (
          <Paper
            key={request.id} 
            sx={{
              padding: 2,
              backgroundColor: "#1f1f1f",
              color: "#ffffff",
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              src={request.avatar ? getAvatarUrl(request.avatar) : null}
              sx={{
                width: 70,
                height: 70,
                marginBottom: 2,
                backgroundColor: "#90caf9",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {!request.avatar && getInitials(request)}
            </Avatar>
            <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
              {request.displayName}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => respondToRequest(request.id, true)} 
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => respondToRequest(request.id, false)} 
              >
                Decline
              </Button>
            </Box>
          </Paper>
        ))
      ) : (
        <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
          No follow requests.
        </Typography>
      )}
    </Box>
  );
};

export default FollowRequests;
