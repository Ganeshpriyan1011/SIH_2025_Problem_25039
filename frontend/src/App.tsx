import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Signup from './pages/Signup';
import theme from './theme';

interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user.email) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{element}</>;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes based on roles */}
          <Route
            path="/citizen-dashboard"
            element={
              <ProtectedRoute
                element={<div>Citizen Dashboard</div>}
                allowedRoles={['citizen']}
              />
            }
          />
          <Route
            path="/official-dashboard"
            element={
              <ProtectedRoute
                element={<div>Official Dashboard</div>}
                allowedRoles={['official']}
              />
            }
          />
          <Route
            path="/analyst-dashboard"
            element={
              <ProtectedRoute
                element={<div>Analyst Dashboard</div>}
                allowedRoles={['analyst']}
              />
            }
          />
          
          {/* Redirect to login for unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;