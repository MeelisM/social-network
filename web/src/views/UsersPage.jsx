import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function AllUsersPage() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUsers() {
            try {
                const usersRes = await fetch("http://localhost:8080/users");
                if (!usersRes.ok) {
                    console.error("Failed to fetch users:", usersRes.status, usersRes.statusText);
                    throw new Error("Failed to fetch users");
                }
                const usersData = (await usersRes.json()) || []; 

                const followingRes = await fetch("http://localhost:8080/following", {
                    credentials: "include",
                });
                if (!followingRes.ok) {
                    console.error(
                        "Failed to fetch following list:",
                        followingRes.status,
                        followingRes.statusText
                    );
                    throw new Error("Failed to fetch following list");
                }
                const followingData = (await followingRes.json()) || []; 
                const followingIds = followingData.map((user) => user.id);

                const updatedUsers = await Promise.all(
                    usersData.map(async (user) => {
                        try {
                            const statusRes = await fetch(
                                `http://localhost:8080/follow/status?user_id=${user.id}`,
                                {
                                    credentials: "include",
                                }
                            );

                            if (!statusRes.ok) {
                                console.error(
                                    `Error fetching follow status for user ID: ${user.id}`,
                                    statusRes.statusText
                                );
                                return { ...user, followStatus: "error" };
                            }

                            const statusData = await statusRes.json();

                            return {
                                ...user,
                                followStatus: followingIds.includes(user.id)
                                    ? "following"
                                    : statusData.status || "not_followed",
                            };
                        } catch (err) {
                            console.error(
                                `Error fetching follow status for user ID: ${user.id}`,
                                err
                            );
                            return { ...user, followStatus: "error" };
                        }
                    })
                );

                setUsers(updatedUsers);
            } catch (err) {
                console.error("Error fetching users or following list:", err);
                setError(err.message);
            }
        }

        fetchUsers();
    }, []);

    const handleFollow = async (userID) => {
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
                console.error("Failed to send follow request:", res.status, res.statusText);
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
        try {
            const res = await fetch(`http://localhost:8080/follow`, {
                method: "DELETE",
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
            console.error("Error unfollowing user:", err);
        }
    };

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
                <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: "bold", marginBottom: 6, textAlign: "center" }}
                >
                    All Users
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                    {users.length > 0 ? (
                        users.map((user) => (
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
                                <Typography
                                    variant="h6"
                                    sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
                                >
                                    {user.nickname || "Unknown"}
                                </Typography>
                                <Button
                                    variant="contained"
                                    sx={{ marginTop: 2 }}
                                    color={
                                        user.followStatus === "not_followed"
                                            ? "primary"
                                            : user.followStatus === "pending"
                                            ? "warning"
                                            : user.followStatus === "following"
                                            ? "success"
                                            : "error"
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (user.followStatus === "not_followed") {
                                            handleFollow(user.id);
                                        } else if (user.followStatus === "following") {
                                            handleUnfollow(user.id);
                                        }
                                    }}
                                >
                                    {user.followStatus === "not_followed"
                                        ? "Follow"
                                        : user.followStatus === "pending"
                                        ? "Request Sent"
                                        : user.followStatus === "following"
                                        ? "Following"
                                        : "Error"}
                                </Button>
                            </Paper>
                        ))
                    ) : (
                        <Typography
                            variant="h6"
                            sx={{ color: "white", textAlign: "center", marginTop: 4 }}
                        >
                            No users found.
                        </Typography>
                    )}
                </Box>
            </Box>
        </MainLayout>
    );
}

export default AllUsersPage;
