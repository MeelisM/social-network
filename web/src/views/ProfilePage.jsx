import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Avatar, Paper, Grid } from "@mui/material";
import MainLayout from "../layouts/MainLayout";

function ProfilePage() {
    const { identifier } = useParams(); // Get 'identifier' from the URL
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        fetchUser();
    }, [identifier]);

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
                    }}
                >
                    <Avatar
                        src={user.avatar}
                        alt={user.nickname}
                        sx={{ width: 70, height: 70, marginRight: 3 }}
                    />
                    <Box>
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
                            {user.followers && user.followers.length > 0 ? (
                                user.followers.map((follower) => (
                                    <Typography
                                        key={follower}
                                        sx={{
                                            fontSize: "0.95rem",
                                            color: "#b0bec5",
                                            marginBottom: 1,
                                        }}
                                    >
                                        {follower}
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
                            {user.following && user.following.length > 0 ? (
                                user.following.map((following) => (
                                    <Typography
                                        key={following}
                                        sx={{
                                            fontSize: "0.95rem",
                                            color: "#b0bec5",
                                            marginBottom: 1,
                                        }}
                                    >
                                        {following}
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
        </MainLayout>
    );
}

export default ProfilePage;
