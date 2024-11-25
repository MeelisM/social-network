import React from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';

const AboutSection = ({ user }) => {
  // Add null check for user
  if (!user) {
    return (
      <Box sx={{
        margin: "0 auto",
        maxWidth: "900px",
        marginTop: 3,
        marginBottom: 4,
        padding: 3,
        backgroundColor: "#1f1f1f",
        borderRadius: 3,
      }}>
        <Typography variant="body1" sx={{ color: "#b0bec5" }}>
          No user information available.
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const InfoItem = ({ label, value }) => (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          color: "#90caf9", 
          mb: 0.5,
          fontSize: '0.875rem',
          fontWeight: 'medium'
        }}
      >
        {label}
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: "#b0bec5",
          fontSize: '1rem',
          wordBreak: 'break-word'
        }}
      >
        {value || "Not specified"}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        margin: "0 auto",
        maxWidth: "900px",
        marginTop: 3,
        marginBottom: 4,
        padding: 3,
        backgroundColor: "#1f1f1f",
        borderRadius: 3,
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          color: "white", 
          marginBottom: 3,
          fontWeight: 'bold'
        }}
      >
        Profile Information
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <InfoItem 
            label="Email" 
            value={user?.email}
          />
          <InfoItem 
            label="Nickname" 
            value={user?.nickname}
          />
          <InfoItem 
            label="Date of Birth" 
            value={user?.date_of_birth ? formatDate(user.date_of_birth) : null}
          />
          <InfoItem 
            label="Profile Visibility" 
            value={user?.is_public !== undefined ? (user.is_public ? "Public" : "Private") : null}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoItem 
            label="Member Since" 
            value={user?.created_at ? formatDate(user.created_at) : null}
          />
          <InfoItem 
            label="Last Updated" 
            value={user?.updated_at ? formatDate(user.updated_at) : null}
          />
          <InfoItem 
            label="Full Name" 
            value={user?.first_name || user?.last_name ? 
              `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
              null
            }
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, backgroundColor: '#333' }} />

      <Typography 
        variant="h6" 
        sx={{ 
          color: "white", 
          mb: 2,
          fontWeight: 'bold'
        }}
      >
        About Me
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: "#b0bec5",
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap'  // This will preserve line breaks in the about_me text
        }}
      >
        {user?.about_me || "No about me information available."}
      </Typography>
    </Box>
  );
};

export default AboutSection;