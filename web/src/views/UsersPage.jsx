import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";

function AllUsersPage() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

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

                const updatedUsers = await Promise.all(
                    filteredData.map(async (user) => {
                        try {
                            const statusRes = await fetch(
                                `http://localhost:8080/follow/status?user_id=${user.id}`,
                                {
                                    credentials: "include",
                                }
                            );
                            const statusData = await statusRes.json();
                            return { 
                                ...user, 
                                followStatus: statusData.status,
                                fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
                            };
                        } catch (err) {
                            console.error(
                                `Error fetching follow status for user ID: ${user.id}`,
                                err
                            );
                            return { 
                                ...user, 
                                followStatus: "error",
                                fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
                            };
                        }
                    })
                );

                setUsers(updatedUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }
        fetchUsers();
    }, [currentUser?.user_id]);

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
            if (!res.ok) return;

            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userID ? { ...user, followStatus: "pending" } : user
                )
            );
        } catch (err) {
            console.error("Error sending follow request:", err);
        }
    };

    const handleUnfollow = (userID) => {
        setUsers((prev) =>
            prev.map((user) =>
                user.id === userID ? { ...user, followStatus: "not_followed" } : user
            )
        );
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
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
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
                                sx={{
                                    width: 70,
                                    height: 70,
                                    marginBottom: 2,
                                    backgroundColor: "#90caf9",
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                }}
                            >
                                {user.fullName[0]?.toUpperCase() ?? "?"}
                            </Avatar>
                            <Typography
                                variant="h6"
                                sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
                            >
                                {user.fullName}
                            </Typography>
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
                                    user.followStatus === "not_followed"
                                        ? handleFollow(user.id)
                                        : handleUnfollow(user.id);
                                }}
                            >
                                {user.followStatus === "not_followed"
                                    ? "Follow"
                                    : user.followStatus === "pending"
                                    ? "Request Sent"
                                    : "Following"}
                            </Button>
                        </Paper>
                    ))}
                </Box>
            </Box>
        </MainLayout>
    );
}

export default AllUsersPage;