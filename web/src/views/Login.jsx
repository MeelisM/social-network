import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Paper, Link } from '@mui/material';
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
      console.log('Attempting login...');

      const response = await axios.post('/login', {
        email,
        password,
      });

      console.log('Raw response:', response);
      console.log('Response data:', response.data);

      const userData = {
        ...response.data,  
        user_id: response.data.id 
      };

      console.log('About to save user data:', userData);

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('Saved user data. Checking localStorage:', 
        JSON.parse(localStorage.getItem('user'))
      );

      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (err) {
      console.error('Detailed login error:', err);
      console.error('Error response:', err.response);
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
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
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
            type="submit"
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

        {/* Register Redirect Options */}
        <Box sx={{ mt: 3 }}>
          {/* Option 1: Text Link */}
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover" color="primary">
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
