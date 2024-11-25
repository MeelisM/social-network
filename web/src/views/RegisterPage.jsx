import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Switch, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nickname: '',
    about_me: '',
    is_public: false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email must be a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Date of birth must be in YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: null }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const requestBody = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      nickname: formData.nickname,
      about_me: formData.about_me,
      is_public: formData.is_public,
    };

    console.log('Request Body:', requestBody); 

    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Data:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      navigate('/login'); 
    } catch (err) {
      console.error('Error during registration:', err.message);
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '0 auto',
        padding: 4,
        bgcolor: '#1f1f1f',
        borderRadius: 3,
        color: 'white',
      }}
    >
      <Typography variant="h4" sx={{ mb: 3 }}>
        Register
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          variant="outlined"
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          variant="outlined"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="First Name"
          name="first_name"
          variant="outlined"
          value={formData.first_name}
          onChange={handleChange}
          error={!!errors.first_name}
          helperText={errors.first_name}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Last Name"
          name="last_name"
          variant="outlined"
          value={formData.last_name}
          onChange={handleChange}
          error={!!errors.last_name}
          helperText={errors.last_name}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Date of Birth"
          name="date_of_birth"
          variant="outlined"
          value={formData.date_of_birth}
          onChange={handleChange}
          error={!!errors.date_of_birth}
          helperText={errors.date_of_birth}
          sx={{ mb: 3 }}
        />
        <TextField
          fullWidth
          label="Nickname"
          name="nickname"
          variant="outlined"
          value={formData.nickname}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="About Me"
          name="about_me"
          multiline
          rows={3}
          variant="outlined"
          value={formData.about_me}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Switch
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
          }
          label="Public Profile"
          sx={{ mb: 2 }}
        />
        <Button fullWidth variant="contained" color="primary" type="submit">
          Register
        </Button>
      </form>
    </Box>
  );
}

export default RegisterPage;
