import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Grid,
    Button,
    Modal,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from "@mui/material";
import { getOwnedGroups, inviteToGroup } from "../service/groupService";
import MainLayout from "../layouts/MainLayout";

function ProfilePage() {
    const { identifier } = useParams(); 
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ownedGroups, setOwnedGroups] = useState([]); 
    const [modalOpen, setModalOpen] = useState(false); 
    const [inviteLoading, setInviteLoading] = useState(false); 

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

        async function fetchOwnedGroups() {
            try {
                const response = await getOwnedGroups();
                console.log("Owned Groups Response:", response);
                setOwnedGroups(Array.isArray(response?.data?.owned_groups) ? response.data.owned_groups : []);
            } catch (error) {
                console.error("Error fetching owned groups:", error);
            }
        }

        fetchUser();
        fetchOwnedGroups();
    }, [identifier]);

    const handleInvite = async (groupId) => {
        setInviteLoading(true);
        try {
            await inviteToGroup(groupId, [user.id]); 
            alert(`Invitation sent to ${user.nickname} for group ID: ${groupId}`);
        } catch (error) {
            console.error("Error sending invite:", error);
            alert("Failed to send invite. Please try again.");
        } finally {
            setInviteLoading(false);
            setModalOpen(false); 
        }
    };

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

                {/* Invite Button */}
                <Box sx={{ textAlign: "center", marginTop: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setModalOpen(true)}
                        disabled={inviteLoading}
                    >
                        Invite to Group
                    </Button>
                </Box>

                {/* Modal for Group Selection */}
                <Modal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Paper
                        sx={{
                            padding: 4,
                            width: "400px",
                            backgroundColor: "#1f1f1f",
                            color: "#ffffff",
                            borderRadius: 3,
                        }}
                    >
                        <Typography variant="h6" sx={{ marginBottom: 2 }}>
                            Select a Group
                        </Typography>
                        {ownedGroups.length === 0 ? (
                            <Typography>No groups available for invitation.</Typography>
                        ) : (
                            <List>
                                {ownedGroups.map((group) => (
                                    <ListItem
                                        button
                                        key={group.id}
                                        onClick={() => handleInvite(group.id)}
                                    >
                                        <ListItemText
                                            primary={group.title}
                                            secondary={group.description || "No description"}
                                            sx={{ color: "white" }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                        {inviteLoading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: "white",
                                    marginTop: 2,
                                    display: "block",
                                    margin: "0 auto",
                                }}
                            />
                        )}
                    </Paper>
                </Modal>
            </Box>
        </MainLayout>
    );
}

export default ProfilePage;
