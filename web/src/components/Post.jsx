// src/components/Post.jsx

import { Card, CardContent, Typography, CardMedia } from '@mui/material';

function Post({ title, content, image, width = '100%' }) {
  return (
    <Card sx={{ mb: 3, bgcolor: '#333', color: 'white', width }}>
      {image && <CardMedia component="img" height="140" image={image} />}
      <CardContent>
        <Typography variant="h6" color="primary">
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#bbb' }}>
          {content}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default Post;
