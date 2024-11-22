import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

function PleaseLoginOrRegister() {
  const navigate = useNavigate();
  const location = useLocation(); 

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center",
        padding: 4,
        bgcolor: "#1f1f1f",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: "#ffffff",
          fontWeight: "bold",
          marginBottom: 2,
        }}
      >
        Please Log In or Register
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "#b0bec5",
          marginBottom: 4,
        }}
      >
        Access user-specific data and unlock personalized features by logging in or creating an account.
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          marginBottom: 4,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/login", { state: { from: location.pathname } })} 
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: 2,
            paddingX: 4,
          }}
        >
          Log In
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate("/register", { state: { from: location.pathname } })} 
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: 2,
            paddingX: 4,
          }}
        >
          Register
        </Button>
      </Box>
      <Button
        variant="text"
        color="secondary"
        onClick={() => navigate(-1)} 
        sx={{
          textTransform: "none",
          fontWeight: "bold",
          color: "#90caf9",
        }}
      >
        Go Back
      </Button>
    </Box>
  );
}

export default PleaseLoginOrRegister;
