import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PleaseLoginOrRegister from "../components/utils/PleaseLoginOrRegister";

function FollowersPage() {
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const navigate = useNavigate();

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
            setter(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const fetchUserDetails = async (userID) => {
        try {
            const res = await fetch(`http://localhost:8080/users/${userID}`, {
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error(`Error fetching user ${userID}: ${res.statusText}`);
            }
            return res.json();
        } catch (err) {
            console.error(err);
            return { nickname: "Unknown", id: userID };
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
                const pendingRequests = await pendingRes.json();

                const detailedRequests = await Promise.all(
                    pendingRequests.map(async (request) => {
                        const userDetails = await fetchUserDetails(request.follower_id);
                        return { ...request, ...userDetails };
                    })
                );

                setFollowRequests(detailedRequests);

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

    const respondToRequest = async (requestID, accept) => {
        try {
            const res = await fetch("http://localhost:8080/follow/respond", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ request_id: requestID, accept }),
            });
            if (!res.ok) {
                console.error("Failed to respond to follow request:", res.status, res.statusText);
                return;
            }
    
            setFollowRequests((prev) =>
                prev.filter((request) => request.id !== requestID)
            );
    
            if (accept) {
                const acceptedUser = followRequests.find((req) => req.id === requestID);
                setFollowers((prev) => [
                    ...prev,
                    { id: acceptedUser.follower_id, nickname: acceptedUser.nickname },
                ]);
            }
        } catch (err) {
            console.error("Error responding to follow request:", err);
        }
    };
    

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

    const renderRequests = () =>
        followRequests.length > 0 ? (
            followRequests.map((request) => (
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
                        sx={{
                            width: 70,
                            height: 70,
                            marginBottom: 2,
                            backgroundColor: "#90caf9",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                        }}
                    >
                        {request.nickname?.[0]?.toUpperCase() ?? "?"}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
                        {request.nickname}
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
        );

    const renderCards = (data, emptyMessage) =>
        data.length > 0 ? (
            data.map((user, index) => (
                <Paper
                    key={user.id || `${user.nickname}-${index}`}
                    sx={{
                        padding: 2,
                        backgroundColor: "#1f1f1f",
                        color: "#ffffff",
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                    onClick={() => user.id && navigate(`/profile/${user.id}`)}
                >
                    <Avatar
                        sx={{
                            width: 70,
                            height: 70,
                            marginBottom: 2,
                            backgroundColor: "#90caf9",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                        }}
                    >
                        {user.nickname?.[0]?.toUpperCase() ?? "?"}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
                        {user.nickname}
                    </Typography>
                </Paper>
            ))
        ) : (
            <Typography variant="h6" sx={{ color: "white", textAlign: "center" }}>
                {emptyMessage}
            </Typography>
        );

    return (
        <MainLayout>
            <Box sx={{ padding: 4, maxWidth: "1400px", margin: "0 auto" }}>
                <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
                    Follow Requests
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3, marginBottom: 6 }}>
                    {renderRequests()}
                </Box>
                <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
                    Followers
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3, marginBottom: 6 }}>
                    {renderCards(followers, "You have no followers yet.")}
                </Box>
                <Typography variant="h5" sx={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>
                    Following
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                    {renderCards(following, "You are not following anyone yet.")}
                </Box>
            </Box>
        </MainLayout>
    );
}

export default FollowersPage;
