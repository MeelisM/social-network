import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const FollowList = ({ data, emptyMessage }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
            {data && data.length > 0 ? (
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
            )}
        </Box>
    );
};

export default FollowList;
