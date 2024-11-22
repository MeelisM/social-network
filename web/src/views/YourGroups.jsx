import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Modal,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router-dom";
import { getOwnedGroups, createGroup, getPendingInvites, respondToGroupJoinRequest } from "../service/groupService";
import MainLayout from "../layouts/MainLayout";

const YourGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false); 
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" }); 
  const [inviteRequests, setInviteRequests] = useState([]); 
  const [inviteLoading, setInviteLoading] = useState(false); 

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await getOwnedGroups(); 
        setGroups(Array.isArray(response?.data?.owned_groups) ? response.data.owned_groups : []);
      } catch (error) {
        console.error("Error fetching owned groups:", error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchInviteRequests = async () => {
      try {
        const response = await getPendingInvites();
        setInviteRequests(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching invite requests:", error);
        setInviteRequests([]);
      }
    };

    fetchGroups();
    fetchInviteRequests();
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Title is required.");
      return;
    }
    setFormLoading(true);
    try {
      const response = await createGroup(formData);
      if (response?.data) {
        setGroups((prev) => [response.data, ...prev]);
        setFormData({ title: "", description: "" });
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleInviteResponse = async (groupId, accept) => {
    setInviteLoading(true);
    try {
      await respondToGroupJoinRequest(groupId, null, accept);
      setInviteRequests((prev) => prev.filter((invite) => invite.id !== groupId));
    } catch (error) {
      console.error("Error responding to invite:", error);
      alert("Failed to respond to invite. Please try again.");
    } finally {
      setInviteLoading(false);
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
          Your Groups
        </Typography>
        <Button
          variant="contained"
          sx={{
            marginBottom: 4,
            backgroundColor: "#1f1f1f",
            color: "white",
            "&:hover": { backgroundColor: "#333" },
          }}
          onClick={handleOpenModal}
        >
          + Create New Group
        </Button>
        {loading ? (
          <CircularProgress sx={{ color: "white", display: "block", margin: "auto" }} />
        ) : groups.length === 0 ? (
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            You haven't created any groups yet.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <Paper
                  sx={{
                    padding: 3,
                    backgroundColor: "#1f1f1f",
                    color: "#ffffff",
                    borderRadius: 3,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#333" },
                  }}
                >
                  <Link
                    to={`/group/${group.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        marginBottom: 2,
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#b0bec5",
                      }}
                    >
                      {group.description || "No description available"}
                    </Typography>
                  </Link>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Invite Requests Section */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: "bold",
            marginTop: 6,
            marginBottom: 4,
          }}
        >
          Group Invitations
        </Typography>
        {inviteRequests.length === 0 ? (
          <Typography
            variant="body1"
            sx={{
              color: "#b0bec5",
              textAlign: "center",
            }}
          >
            No pending group invitations.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {inviteRequests.map((invite) => (
              <Grid item xs={12} sm={6} md={4} key={invite.id}>
                <Paper
                  sx={{
                    padding: 3,
                    backgroundColor: "#1f1f1f",
                    color: "#ffffff",
                    borderRadius: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      marginBottom: 2,
                    }}
                  >
                    {invite.title}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ marginRight: 2 }}
                    onClick={() => handleInviteResponse(invite.id, true)}
                    disabled={inviteLoading}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleInviteResponse(invite.id, false)}
                    disabled={inviteLoading}
                  >
                    Decline
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modal for creating a new group */}
        <Modal
          open={modalOpen}
          onClose={handleCloseModal}
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
            <Typography
              variant="h5"
              sx={{
                marginBottom: 3,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Create New Group
            </Typography>
            <TextField
              label="Group Title"
              variant="outlined"
              fullWidth
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              sx={{
                marginBottom: 3,
                "& .MuiInputLabel-root": { color: "#b0bec5" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#b0bec5" },
                  "&:hover fieldset": { borderColor: "white" },
                },
              }}
              InputLabelProps={{
                style: { color: "#b0bec5" },
              }}
              InputProps={{
                style: { color: "white" },
              }}
            />
            <TextField
              label="Group Description (Optional)"
              variant="outlined"
              fullWidth
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              sx={{
                marginBottom: 3,
                "& .MuiInputLabel-root": { color: "#b0bec5" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#b0bec5" },
                  "&:hover fieldset": { borderColor: "white" },
                },
              }}
              InputLabelProps={{
                style: { color: "#b0bec5" },
              }}
              InputProps={{
                style: { color: "white" },
              }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={formLoading}
              sx={{
                backgroundColor: "#333",
                "&:hover": { backgroundColor: "#555" },
              }}
            >
              {formLoading ? "Creating..." : "Create Group"}
            </Button>
          </Paper>
        </Modal>
      </Box>
    </MainLayout>
  );
};

export default YourGroups;
