import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { getAllGroups } from "../service/group";
import MainLayout from "../layouts/MainLayout";

const AllGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await getAllGroups();
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching all groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

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
          All Groups
        </Typography>
        {loading ? (
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Loading groups...
          </Typography>
        ) : groups.length === 0 ? (
          <Typography
            variant="h6"
            sx={{
              color: "white",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            No groups available.
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
                    to={`/group/${group.id}`} // Redirect to group detail page
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
      </Box>
    </MainLayout>
  );
};

export default AllGroups;
