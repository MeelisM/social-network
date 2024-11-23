import React from "react";
import { Typography, Grid, Paper } from "@mui/material";

const Member = ({ members }) => {
  return (
    <div>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Members
      </Typography>
      <Grid container spacing={2} sx={{ marginBottom: 4 }}>
        {members?.length > 0 ? (
          members.map((member) => (
            <Grid item xs={12} sm={6} key={member.user_id}>
              <Paper
                sx={{
                  padding: 2,
                  backgroundColor: "#333",
                  textAlign: "center",
                  color: "white",
                }}
              >
                {`${member.first_name} ${member.last_name}`} <br />
                <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                  {member.email}
                </Typography>
              </Paper>
            </Grid>
          ))
        ) : (
          <Typography>No members yet.</Typography>
        )}
      </Grid>
    </div>
  );
};

export default Member;
