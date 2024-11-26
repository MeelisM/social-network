import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Switch, 
  FormControlLabel,
  Avatar,
  IconButton
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
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
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar file size should be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setAvatar(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Cleanup preview URL when component unmounts
    return () => URL.revokeObjectURL(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();
    
    // Add user data as JSON string
    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      nickname: formData.nickname,
      about_me: formData.about_me,
      is_public: formData.is_public,
    };
    
    formDataToSend.append('userData', JSON.stringify(userData));
    
    // Add avatar if selected
    if (avatar) {
      formDataToSend.append('avatar', avatar);
    }
  
    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        body: formDataToSend,
      });
  
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        } else {
          const errorText = await response.text();
          if (errorText.includes('UNIQUE constraint failed')) {
            throw new Error('A user with this email already exists');
          } else {
            throw new Error(errorText || 'Unexpected error occurred');
          }
        }
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

      {/* Avatar Upload */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={avatarPreview}
            sx={{ 
              width: 100, 
              height: 100,
              bgcolor: '#2f2f2f',
              border: '2px solid #90caf9'
            }}
          />
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-upload">
            <IconButton
              component="span"
              sx={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                bgcolor: '#90caf9',
                '&:hover': { bgcolor: '#64b5f6' },
                color: 'white'
              }}
            >
              <PhotoCamera />
            </IconButton>
          </label>
        </Box>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
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
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
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
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
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
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
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
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        />
        <TextField
          fullWidth
          label="Nickname"
          name="nickname"
          variant="outlined"
          value={formData.nickname}
          onChange={handleChange}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
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
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        />
        <FormControlLabel
          control={
            <Switch
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#90caf9',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#64b5f6',
                },
              }}
            />
          }
          label="Public Profile"
          sx={{ 
            mb: 2,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        />
        <Button 
          fullWidth 
          variant="contained" 
          color="primary" 
          type="submit"
          sx={{
            bgcolor: '#90caf9',
            '&:hover': {
              bgcolor: '#64b5f6',
            },
          }}
        >
          Register
        </Button>
      </form>
    </Box>
  );
}

export default RegisterPage;