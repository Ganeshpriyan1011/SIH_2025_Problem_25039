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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { 
  Person, 
  Email, 
  Phone, 
  Lock, 
  Visibility, 
  VisibilityOff,
  WorkOutline,
  Security
} from '@mui/icons-material';
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
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: '#2A2A2A',
          '&:hover': {
            backgroundColor: '#353535',
          },
          '&.Mui-focused': {
            backgroundColor: '#353535',
          },
        },
      },
    },
    MuiFormControl: {
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

interface SignupValues {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
}

interface OtpValues {
  otp: string;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['citizen', 'official', 'analyst'], 'Invalid role')
    .required('Role is required'),
});

const otpValidationSchema = Yup.object({
  otp: Yup.string()
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

const Signup = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: SignupValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      setTempEmail(values.email);
      setShowOtpForm(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (values: OtpValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: tempEmail,
          otp: values.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
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
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'citizen': return '👤';
      case 'official': return '🏛️';
      case 'analyst': return '📊';
      default: return '👤';
    }
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
            {/* Header */}
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
                {showOtpForm ? 'Verify Your Account' : 'Create Account'}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#B0B0B0',
                  fontSize: '18px',
                }}
              >
                {showOtpForm 
                  ? 'Enter the OTP sent to your email' 
                  : 'Join us today and get started'
                }
              </Typography>
            </Box>

            <Card sx={{ width: '100%', maxWidth: 500 }}>
              <CardContent sx={{ p: 4 }}>
                {isLoading && (
                  <LinearProgress 
                    sx={{ 
                      mb: 2,
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)',
                      },
                    }} 
                  />
                )}
                
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

                {!showOtpForm ? (
                  <Formik
                    initialValues={{
                      name: '',
                      email: '',
                      mobile: '',
                      password: '',
                      role: '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ errors, touched, handleChange, handleBlur, values }) => (
                      <Form>
                        <TextField
                          fullWidth
                          id="name"
                          name="name"
                          label="Full Name"
                          variant="outlined"
                          margin="normal"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.name}
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person sx={{ color: '#2196F3' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 2 }}
                        />

                        <TextField
                          fullWidth
                          id="email"
                          name="email"
                          label="Email Address"
                          variant="outlined"
                          margin="normal"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.email}
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
                          id="mobile"
                          name="mobile"
                          label="Mobile Number"
                          variant="outlined"
                          margin="normal"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.mobile}
                          error={touched.mobile && Boolean(errors.mobile)}
                          helperText={touched.mobile && errors.mobile}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone sx={{ color: '#2196F3' }} />
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
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.password}
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
                          sx={{ mb: 2 }}
                        />

                        <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
                          <InputLabel id="role-label" sx={{ color: '#B0B0B0' }}>
                            Select Role
                          </InputLabel>
                          <Select
                            labelId="role-label"
                            id="role"
                            name="role"
                            value={values.role}
                            label="Select Role"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.role && Boolean(errors.role)}
                            startAdornment={
                              <InputAdornment position="start">
                                <WorkOutline sx={{ color: '#2196F3', ml: 1 }} />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="citizen">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{getRoleIcon('citizen')}</span>
                                Citizen
                              </Box>
                            </MenuItem>
                            <MenuItem value="official">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{getRoleIcon('official')}</span>
                                Government Official
                              </Box>
                            </MenuItem>
                            <MenuItem value="analyst">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{getRoleIcon('analyst')}</span>
                                Data Analyst
                              </Box>
                            </MenuItem>
                          </Select>
                          {touched.role && errors.role && (
                            <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 2 }}>
                              {errors.role}
                            </Typography>
                          )}
                        </FormControl>

                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={isLoading}
                          sx={{ 
                            mb: 3,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1976D2 30%, #1BB5E3 90%)',
                            },
                          }}
                        >
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </Form>
                    )}
                  </Formik>
                ) : (
                  <Formik
                    initialValues={{
                      otp: '',
                    }}
                    validationSchema={otpValidationSchema}
                    onSubmit={handleOtpSubmit}
                  >
                    {({ errors, touched, handleChange, handleBlur, values }) => (
                      <Form>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Security sx={{ fontSize: 48, color: '#2196F3', mb: 2 }} />
                          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
                            We've sent a 6-digit verification code to
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#2196F3', fontWeight: 600 }}>
                            {tempEmail}
                          </Typography>
                        </Box>
                        
                        <TextField
                          fullWidth
                          id="otp"
                          name="otp"
                          label="Enter OTP"
                          variant="outlined"
                          margin="normal"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.otp}
                          error={touched.otp && Boolean(errors.otp)}
                          helperText={touched.otp && errors.otp}
                          inputProps={{
                            maxLength: 6,
                            style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }
                          }}
                          sx={{ mb: 3 }}
                        />

                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={isLoading}
                          sx={{ 
                            mb: 2,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1976D2 30%, #1BB5E3 90%)',
                            },
                          }}
                        >
                          {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </Button>

                        <Button
                          fullWidth
                          variant="text"
                          onClick={() => setShowOtpForm(false)}
                          sx={{ 
                            color: '#B0B0B0',
                            '&:hover': {
                              color: '#2196F3',
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            },
                          }}
                        >
                          Back to Sign Up
                        </Button>
                      </Form>
                    )}
                  </Formik>
                )}

                {!showOtpForm && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                      Already have an account?{' '}
                      <Link
                        href="/login"
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
                        Sign in here
                      </Link>
                    </Typography>
                  </Box>
                )}
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

export default Signup;