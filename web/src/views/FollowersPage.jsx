import { Box, Typography, Avatar, Paper } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { followers } from '../mockData';

function FollowersPage() {
  return (
    <MainLayout>
      <Box
        sx={{
          padding: 4,
          maxWidth: '1400px', // Centered content with max width
          margin: '0 auto', // Center the content
        }}
      >
        {/* Followers Title */}
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            marginBottom: 6, // Consistent spacing
            textAlign: 'center',
          }}
        >
          Followers
        </Typography>

        {/* Followers Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)', // Define 5 equal columns
            gap: 3, // Spacing between items
          }}
        >
          {followers.map((follower) => (
            <Paper
              key={follower.id}
              sx={{
                padding: 2,
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center', // Center align content
              }}
            >
              {/* Follower Avatar */}
              <Avatar
                sx={{
                  width: 70,
                  height: 70,
                  marginBottom: 2, // Consistent spacing
                  backgroundColor: '#90caf9',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {follower.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')} {/* Display initials */}
              </Avatar>

              {/* Follower Name */}
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {follower.name}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </MainLayout>
  );
}
export default FollowersPage;
