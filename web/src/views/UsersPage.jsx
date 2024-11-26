import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";

function AllUsersPage() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

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
        async function fetchUsers() {
            try {
                const res = await fetch("http://localhost:8080/users");
                if (!res.ok) {
                    console.error("Failed to fetch users:", res.status, res.statusText);
                    return;
                }

                const data = await res.json();
                const filteredData = data.filter(user => user.id !== currentUser?.user_id);

                let updatedUsers;

                if (currentUser) {
                    // Authenticated: Fetch follow status
                    updatedUsers = await Promise.all(
                        filteredData.map(async (user) => {
                            try {
                                const statusRes = await fetch(
                                    `http://localhost:8080/follow/status?user_id=${user.id}`,
                                    {
                                        credentials: "include",
                                    }
                                );
                                if (!statusRes.ok) {
                                    throw new Error(`Failed to fetch follow status: ${statusRes.statusText}`);
                                }
                                const statusData = await statusRes.json();
                                return { 
                                    ...user, 
                                    followStatus: statusData.status, // e.g., "not_followed", "pending", "following"
                                    fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
                                };
                            } catch (err) {
                                console.error(
                                    `Error fetching follow status for user ID: ${user.id}`,
                                    err
                                );
                                return { 
                                    ...user, 
                                    followStatus: "error", // Handle error state
                                    fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
                                };
                            }
                        })
                    );
                } else {
                    // Guest: Do not fetch follow status
                    updatedUsers = filteredData.map(user => ({
                        ...user,
                        followStatus: null, // Indicates no follow status available
                        fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
                    }));
                }

                setUsers(updatedUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }
        fetchUsers();
    }, [currentUser?.user_id]);

    const handleFollow = async (userID) => {
        if (!currentUser) {
            // Redirect to login or show a prompt
            navigate('/login-required');
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/follow`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userID }),
            });
            if (!res.ok) {
                console.error("Failed to follow user:", res.status, res.statusText);
                return;
            }

            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userID ? { ...user, followStatus: "pending" } : user
                )
            );
        } catch (err) {
            console.error("Error sending follow request:", err);
        }
    };

    const handleUnfollow = async (userID) => {
        if (!currentUser) {
            // Redirect to login or show a prompt
            navigate('/login-required');
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/follow`, {
                method: "DELETE", // Assuming DELETE is used to unfollow
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userID }),
            });
            if (!res.ok) {
                console.error("Failed to unfollow user:", res.status, res.statusText);
                return;
            }

            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userID ? { ...user, followStatus: "not_followed" } : user
                )
            );
        } catch (err) {
            console.error("Error sending unfollow request:", err);
        }
    };

    return (
        <MainLayout>
            <Box sx={{ padding: 4, maxWidth: "1400px", margin: "0 auto" }}>
                <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: "bold", marginBottom: 6, textAlign: "center" }}
                >
                    All Users
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 3 }}>
                    {users.map((user) => (
                        <Paper
                            key={user.id}
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
                            onClick={() => navigate(`/profile/${user.id}`)}
                        >
                            <Avatar
                                src={user.avatar ? getAvatarUrl(user.avatar) : null}
                                sx={{
                                    width: 70,
                                    height: 70,
                                    marginBottom: 2,
                                    backgroundColor: "#90caf9",
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                }}
                            >
                                {!user.avatar && getInitials(user)}
                            </Avatar>
                            <Typography
                                variant="h6"
                                sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
                            >
                                {user.fullName}
                            </Typography>
                            {/* Only show follow button if user is authenticated and followStatus is not null */}
                            {currentUser && user.followStatus !== null && (
                                <Button
                                    variant="contained"
                                    sx={{ marginTop: 2 }}
                                    color={
                                        user.followStatus === "not_followed"
                                            ? "primary"
                                            : user.followStatus === "pending"
                                            ? "warning"
                                            : "success"
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        if (user.followStatus === "not_followed") {
                                            handleFollow(user.id);
                                        } else if (user.followStatus === "following") {
                                            handleUnfollow(user.id);
                                        }
                                        // Optionally handle other statuses like "error" or "pending"
                                    }}
                                    disabled={user.followStatus === "pending" || user.followStatus === "error"}
                                >
                                    {user.followStatus === "not_followed"
                                        ? "Follow"
                                        : user.followStatus === "pending"
                                        ? "Request Sent"
                                        : user.followStatus === "following"
                                        ? "Following"
                                        : "Follow"}
                                </Button>
                            )}
                        </Paper>
                    ))}
                </Box>
            </Box>
        </MainLayout>
    );
}

export default AllUsersPage;
