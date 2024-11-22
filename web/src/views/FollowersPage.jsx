import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function FollowersPage() {
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch followers, following, and follow requests
    const fetchData = async (url, setter) => {
        try {
            const res = await fetch(url, {
                credentials: "include",
            });
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

    useEffect(() => {
        async function fetchAllData() {
            await Promise.all([
                fetchData("http://localhost:8080/follow/pending", setFollowRequests),
                fetchData("http://localhost:8080/followers", setFollowers),
                fetchData("http://localhost:8080/following", setFollowing),
            ]);
            setLoading(false);
        }
        fetchAllData();
    }, []);

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
                    Loading data...
                </Typography>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Typography
                    variant="h6"
                    sx={{
                        color: "red",
                        textAlign: "center",
                        marginTop: 4,
                    }}
                >
                    {error}
                </Typography>
            </MainLayout>
        );
    }

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
                        "&:hover": { backgroundColor: "#333" }, 
                    }}
                    onClick={() => user.id && navigate(`/profile/${user.id}`)} // Navigate only if ID exists
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
                        {user.nickname[0]?.toUpperCase() ?? "?"}
                    </Avatar>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                        }}
                    >
                        {user.nickname}
                    </Typography>
                </Paper>
            ))
        ) : (
            <Typography
                variant="h6"
                sx={{
                    color: "white",
                    textAlign: "center",
                    marginTop: 2,
                }}
            >
                {emptyMessage}
            </Typography>
        );

    return (
        <MainLayout>
            <Box
                sx={{
                    padding: 4,
                    maxWidth: "1400px",
                    margin: "0 auto",
                }}
            >
                {/* Follow Requests */}
                <Typography
                    variant="h5"
                    sx={{
                        color: "white",
                        fontWeight: "bold",
                        marginBottom: 4,
                    }}
                >
                    Follow Requests
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 3,
                        marginBottom: 6,
                    }}
                >
                    {renderCards(followRequests, "No follow requests.")}
                </Box>

                {/* Followers */}
                <Typography
                    variant="h5"
                    sx={{
                        color: "white",
                        fontWeight: "bold",
                        marginBottom: 4,
                    }}
                >
                    Followers
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 3,
                        marginBottom: 6,
                    }}
                >
                    {renderCards(followers, "You have no followers yet.")}
                </Box>

                {/* Following */}
                <Typography
                    variant="h5"
                    sx={{
                        color: "white",
                        fontWeight: "bold",
                        marginBottom: 4,
                    }}
                >
                    Following
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 3,
                    }}
                >
                    {renderCards(following, "You are not following anyone yet.")}
                </Box>
            </Box>
        </MainLayout>
    );
}

export default FollowersPage;
