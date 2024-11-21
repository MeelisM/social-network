import { Box, Typography, Avatar, Paper, Grid } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { posts } from '../mockData';

function MainPage() {
  return (
    <MainLayout>
      <Box
        sx={{
          padding: 4,
          maxWidth: '900px', 
          margin: '0 auto', 
        }}
      >
        {/* Feed Title */}
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            marginBottom: 6, 
            textAlign: 'center',
          }}
        >
          Feed
        </Typography>

        {/* Posts Section */}
        <Grid container spacing={4}>
          {posts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <Paper
                sx={{
                  padding: 3,
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderRadius: 3,
                }}
              >
                {/* Poster Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                  <Avatar
                    src={post.poster.avatar}
                    alt={`${post.poster.first_name} ${post.poster.last_name}`}
                    sx={{
                      width: 50,
                      height: 50,
                      marginRight: 2,
                      border: '2px solid #90caf9',
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {`${post.poster.first_name} ${post.poster.last_name}`}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#90caf9',
                      }}
                    >
                      @{post.poster.nickname}
                    </Typography>
                  </Box>
                </Box>

                {/* Post Content */}
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#90caf9',
                      marginBottom: 2,
                      fontWeight: 'bold',
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#b0bec5',
                      marginBottom: 3,
                    }}
                  >
                    {post.content}
                  </Typography>
                  {post.image && (
                    <Box
                      component="img"
                      src={post.image}
                      alt={post.title}
                      sx={{
                        width: '100%',
                        maxWidth: '850px',
                        maxHeight: '600px',
                        objectFit: 'cover',
                        borderRadius: 3,
                        display: 'block',
                        margin: '20px auto',
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </MainLayout>
  );
}

export default MainPage;
