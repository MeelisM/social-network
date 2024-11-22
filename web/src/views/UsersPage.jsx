import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";
import MainLayout from "../layouts/MainLayout";

function AllUsersPage() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        async function fetchUsers() {
            try {
                console.log("Fetching all users...");
                const res = await fetch("http://localhost:8080/users");
                if (!res.ok) {
                    console.error("Failed to fetch users:", res.status, res.statusText);
                    return;
                }

                const data = await res.json();
                console.log("Fetched users:", data);

                const updatedUsers = await Promise.all(
                    data.map(async (user) => {
                        try {
                            console.log(`Fetching follow status for user ID: ${user.id}`);
                            const statusRes = await fetch(
                                `http://localhost:8080/follow/status?user_id=${user.id}`,
                                {
                                    credentials: "include",
                                }
                            );
                            if (!statusRes.ok) {
                                console.error(
                                    `Failed to fetch follow status for user ID: ${user.id}`,
                                    statusRes.status,
                                    statusRes.statusText
                                );
                                return { ...user, followStatus: "error" };
                            }

                            const statusData = await statusRes.json();
                            console.log(`Follow status for user ID ${user.id}:`, statusData);
                            return { ...user, followStatus: statusData.status };
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
                console.log("Updated users with follow statuses:", updatedUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }
        fetchUsers();
    }, []);

    const handleFollow = async (userID) => {
        try {
            console.log(`Sending follow request for user ID: ${userID}`);
            const res = await fetch(`http://localhost:8080/follow`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userID }),
            });
            if (!res.ok) {
                console.error(
                    `Failed to send follow request for user ID: ${userID}`,
                    res.status,
                    res.statusText
                );
                return;
            }

            console.log(`Follow request sent successfully for user ID: ${userID}`);
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userID ? { ...user, followStatus: "pending" } : user
                )
            );
        } catch (err) {
            console.error(`Error sending follow request for user ID: ${userID}`, err);
        }
    };

    const handleUnfollow = async (userID) => {
        try {
            console.log(`Unfollowing user ID: ${userID}`);
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userID
                        ? { ...user, followStatus: "not_followed" }
                        : user
                )
            );
            console.log(`Unfollowed user ID: ${userID}`);
        } catch (err) {
            console.error(`Error unfollowing user ID: ${userID}`, err);
        }
    };

    return (
        <MainLayout>
            <Box
                sx={{
                    padding: 4,
                    maxWidth: "1400px",
                    margin: "0 auto",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: "white",
                        fontWeight: "bold",
                        marginBottom: 6,
                        textAlign: "center",
                    }}
                >
                    All Users
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 3,
                    }}
                >
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
                            <Button
                                variant="contained"
                                sx={{
                                    marginTop: 2,
                                }}
                                color={
                                    user.followStatus === "not_followed"
                                        ? "primary"
                                        : user.followStatus === "pending"
                                        ? "warning"
                                        : "success"
                                }
                                onClick={() =>
                                    user.followStatus === "not_followed"
                                        ? handleFollow(user.id)
                                        : handleUnfollow(user.id)
                                }
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
