import React from "react";
import { Box, Typography, Avatar, Paper, Button } from "@mui/material";

const FollowRequests = ({ followRequests, setFollowRequests, setFollowers }) => {
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

            setFollowRequests((prev) => prev.filter((request) => request.id !== requestID));

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

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3, marginBottom: 6 }}>
            {followRequests && followRequests.length > 0 ? (
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
                            <Button variant="contained" color="primary" onClick={() => respondToRequest(request.id, true)}>
                                Accept
                            </Button>
                            <Button variant="contained" color="error" onClick={() => respondToRequest(request.id, false)}>
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
