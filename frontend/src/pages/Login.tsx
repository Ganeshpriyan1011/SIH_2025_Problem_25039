import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom theme with black and blue colors
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196F3', // Bright blue
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0D47A1', // Dark blue
      light: '#42A5F5',
      dark: '#0A3A8A',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0A0A0A', // Deep black
      paper: '#1A1A1A', // Dark gray for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2A2A2A',
            '&:hover': {
              backgroundColor: '#353535',
            },
            '&.Mui-focused': {
              backgroundColor: '#353535',
            },
            '& fieldset': {
              borderColor: '#404040',
            },
            '&:hover fieldset': {
              borderColor: '#2196F3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2196F3',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontSize: '16px',
          fontWeight: 600,
          padding: '12px 24px',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
          border: '1px solid #333333',
        },
      },
    },
  },
});

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      switch (data.user.role) {
        case 'citizen':
          navigate('/citizen-dashboard');
          break;
        case 'official':
          navigate('/official-dashboard');
          break;
        case 'analyst':
          navigate('/analyst-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, #16213E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Header with logo/title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                component="h1" 
                variant="h3" 
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                OCEAN HAZARD APP
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#B0B0B0',
                  fontSize: '18px',
                }}
              >
                Sign in to your account
              </Typography>
            </Box>
            
            <Card sx={{ width: '100%', maxWidth: 450 }}>
              <CardContent sx={{ p: 4 }}>
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      '& .MuiAlert-icon': {
                        color: '#f44336',
                      },
                    }}
                  >
                    {error}
                  </Alert>
                )}
                
                <Formik
                  initialValues={{
                    email: '',
                    password: '',
                  }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, handleChange, handleBlur, values }) => (
                    <Form>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: '#2196F3' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        id="password"
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="normal"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: '#2196F3' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                sx={{ color: '#B0B0B0' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />
                      
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ 
                          mb: 3,
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1976D2 30%, #1BB5E3 90%)',
                          },
                        }}
                      >
                        Sign In
                      </Button>
                    </Form>
                  )}
                </Formik>
                
                {/* Forgot password link */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Link
                    href="/forgot-password"
                    variant="body2"
                    sx={{ 
                      color: '#2196F3',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: '#64B5F6',
                      },
                    }}
                  >
                    Forgot your password?
                  </Link>
                </Box>
                
                {/* Sign up link */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                    Don't have an account?{' '}
                    <Link
                      href="/signup"
                      variant="body2"
                      sx={{ 
                        color: '#2196F3',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#64B5F6',
                        },
                      }}
                    >
                      Sign up here
                    </Link>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            {/* Footer */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666666',
                mt: 4,
                textAlign: 'center',
              }}
            >
              © 2024 Your Company. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;