import { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper } from '@mui/material';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Placeholder for login logic
    console.log("Logging in with", email, password);
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          borderRadius: 2,
          bgcolor: '#1e1e1e',
          color: 'white',
          width: '100%',
          maxWidth: 400, 
          textAlign: 'center',
        }}
      >
        {/* Header */}
        <Typography variant="h4" color="primary" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please log in to continue
        </Typography>

        {/* Login Form */}
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 3,
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            label="Email"
            variant="filled"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              sx: { bgcolor: 'grey.800', color: 'white', borderRadius: 1 },
            }}
            InputLabelProps={{
              sx: { color: 'grey.400' },
            }}
          />
          <TextField
            label="Password"
            type="password"
            variant="filled"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              sx: { bgcolor: 'grey.800', color: 'white', borderRadius: 1 },
            }}
            InputLabelProps={{
              sx: { color: 'grey.400' },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleLogin}
            sx={{
              mt: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 1,
            }}
          >
            Log In
          </Button>
        </Box>

        {/* Optional Footer Text */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Don’t have an account? <a href="#signup" style={{ color: '#90caf9' }}>Sign up here</a>
        </Typography>
      </Paper>
    </Container>
  );
}

export default Login;
