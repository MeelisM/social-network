import { Box, Typography, Avatar, Paper, Grid } from '@mui/material';
import MainLayout from '../layouts/MainLayout'; 
import { users } from '../mockData'; 

function ProfilePage({ userId }) {
  const user = users.find((u) => u.id === userId); // Find the user by ID

  if (!user) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Typography variant="h5" color="error">
            User not found!
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
            display: 'flex',
            alignItems: 'center',
            marginBottom: 6, 
            maxWidth: '900px', 
            margin: '0 auto', 
          }}
        >
          <Avatar
            src={user.avatar}
            alt={`${user.first_name} ${user.last_name}`}
            sx={{ width: 70, height: 70, marginRight: 3 }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {`${user.first_name} ${user.last_name}`}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#90caf9',
              }}
            >
              @{user.nickname}
            </Typography>
          </Box>
        </Box>

        {/* About and Posts Sections */}
        <Grid
          container
          spacing={4} 
          sx={{
            maxWidth: '900px', 
            margin: '0 auto', 
          }}
        >
          <Grid item xs={12}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                About Me
              </Typography>
              <Typography variant="body1">
                {user.about_me || 'No information provided.'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Posts
              </Typography>
              {user.posts && user.posts.length > 0 ? (
                user.posts.map((post) => (
                  <Box key={post.id} sx={{ marginBottom: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#90caf9', marginBottom: 1 }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                      {post.content}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">No posts available.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Followers and Following */}
        <Grid
          container
          spacing={4}
          sx={{
            marginTop: 4, 
            maxWidth: '900px', 
            margin: '0 auto', 
          }}
        >
          <Grid item xs={6}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Followers
              </Typography>
              {user.followers && user.followers.length > 0 ? (
                user.followers.map((followerId) => {
                  const follower = users.find((u) => u.id === followerId);
                  return (
                    <Typography
                      key={follower?.id}
                      sx={{ fontSize: '0.95rem', color: '#b0bec5', marginBottom: 1 }}
                    >
                      {follower?.first_name} {follower?.last_name}
                    </Typography>
                  );
                })
              ) : (
                <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                  No followers.
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper
              sx={{
                padding: 3,
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Following
              </Typography>
              {user.following && user.following.length > 0 ? (
                user.following.map((followingId) => {
                  const following = users.find((u) => u.id === followingId);
                  return (
                    <Typography
                      key={following?.id}
                      sx={{ fontSize: '0.95rem', color: '#b0bec5', marginBottom: 1 }}
                    >
                      {following?.first_name} {following?.last_name}
                    </Typography>
                  );
                })
              ) : (
                <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                  Not following anyone.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}

export default ProfilePage;
