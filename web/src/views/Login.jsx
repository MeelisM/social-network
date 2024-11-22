// views/Login.js
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useAxios } from '../utils/axiosInstance';

function Login() {
  const { setUser } = useAuth();
  const axios = useAxios();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await axios.post('/login', {
        email,
        password,
      });
  
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
  
      // Redirect to main page or previous page
      const from = location.state?.from?.pathname || '/main';
      navigate(from);
    } catch (err) {
      console.error('Error during login:', err.message);
      setError(err.response?.data?.message || 'Login failed');
    }
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
        <Typography variant="h4" color="primary" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please log in to continue
        </Typography>

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
          {error && <Typography color="error">{error}</Typography>}
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
      </Paper>
    </Container>
  );
}

export default Login;
