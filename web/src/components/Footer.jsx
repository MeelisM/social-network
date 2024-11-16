import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1f1f1f',
        color: '#fff',
        textAlign: 'center',
        py: 2,
        mt: 'auto', // Push footer to the bottom
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} Social Network. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
