import { Report, SocialMediaPost, HazardType, Role, User, ApprovalStatus } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token from localStorage
const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  console.log('🔑 DEBUG: Auth token for request:', token ? 'Present' : 'Missing');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log('🔑 DEBUG: Request headers:', headers);

  return fetch(url, {
    ...options,
    headers,
  });
};

// User Portal API calls (Citizens)
export const registerUser = async (email: string, password: string, name: string): Promise<{ requiresVerification: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/user/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
};

// Admin Portal API calls (Officials & Analysts)
export const registerAdmin = async (email: string, password: string, name: string, role: Role, employeeId: string): Promise<{ requiresApproval: boolean; message: string; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/auth/admin/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      role: role.toLowerCase(),
      employeeId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Admin registration failed');
  }

  // Admin registration creates a pending user - NO token should be stored
  // User must be approved by super admin before they can login
  
  return {
    requiresApproval: data.requiresApproval || true,
    message: data.message,
    user: data.user
  };
};

// Legacy registration for backward compatibility
export const registerUserLegacy = async (email: string, password: string, name: string, role: Role): Promise<{ requiresVerification: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      role: role.toLowerCase(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
};

export const verifyOTP = async (email: string, otp: string): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      otp,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }

  // Store the token for authenticated requests
  console.log('🔑 DEBUG: Storing auth token after OTP verification:', data.token ? 'Token received' : 'No token in response');
  setAuthToken(data.token);
  console.log('🔑 DEBUG: Token stored, checking localStorage:', localStorage.getItem('authToken') ? 'Present' : 'Missing');

  return data;
};


// User Portal Login (Citizens)
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    console.log('Making API request to:', `${API_BASE_URL}/auth/user/login`);
    const response = await fetch(`${API_BASE_URL}/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store the token
    setAuthToken(data.token);

    return data;
  } catch (error) {
    throw error;
  }
};

// Admin Portal Login (Officials & Analysts)
export const loginAdmin = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    // Clear any existing tokens first
    removeAuthToken();
    
    console.log('Making admin API request to:', `${API_BASE_URL}/auth/admin/login`);
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    const requestBody = { email, password };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Admin response status:', response.status);
    console.log('Admin response ok:', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      console.error('Login failed with status:', response.status);
      console.error('Error message:', data.message);
      throw new Error(data.message || 'Admin login failed');
    }

    // Store the token
    console.log('Storing auth token:', data.token ? 'Token received' : 'No token in response');
    if (data.token) {
      setAuthToken(data.token);
      console.log('Token stored successfully');
    } else {
      console.error('No token in successful response!');
    }

    return data;
  } catch (error) {
    console.error('Admin API request failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Legacy login for backward compatibility
export const loginUserLegacy = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Store the token
  setAuthToken(data.token);

  return data;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await makeAuthenticatedRequest(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    // Always remove token from localStorage
    removeAuthToken();
  }
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/me`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get current user');
  }

  return data.user;
};

// Reports API calls
export const fetchInitialData = async (): Promise<{ reports: Report[]; socialMediaPosts: SocialMediaPost[] }> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/reports?limit=50`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reports');
    }

    // For now, return empty social media posts since we don't have that endpoint yet
    // You can implement social media ingestion later
    const socialMediaPosts: SocialMediaPost[] = [];

    return {
      reports: data.data.reports,
      socialMediaPosts,
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    // Return empty data on error
    return {
      reports: [],
      socialMediaPosts: [],
    };
  }
};

export const submitNewReport = async (reportData: {
  hazard: HazardType;
  description: string;
  location: { lat: number; lng: number; name: string };
  image?: string;
  summary: string;
}): Promise<Report> => {
  // Debug logging
  console.log('🐛 DEBUG: Submitting report data:', reportData);
  console.log('🐛 DEBUG: Report data JSON:', JSON.stringify(reportData, null, 2));
  
  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/reports`, {
    method: 'POST',
    body: JSON.stringify(reportData),
  });

  console.log('🐛 DEBUG: Response status:', response.status);
  console.log('🐛 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));

  const data = await response.json();
  console.log('🐛 DEBUG: Response data:', data);

  if (!response.ok) {
    console.error('🐛 DEBUG: Validation errors:', data.errors);
    throw new Error(data.message || 'Failed to submit report');
  }

  return data.data.report;
};

export const verifyReportById = async (reportId: string, verificationNote?: string): Promise<Report> => {
  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/reports/${reportId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verificationNote }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify report');
  }

  return data.data.report;
};

export const rejectReportById = async (reportId: string, rejectionReason: string): Promise<Report> => {
  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/reports/${reportId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject report');
  }

  return data.data.report;
};

// Delete functionality removed - Reports can only be rejected to maintain audit trail

export const updateUser = async (userId: string, userData: { name?: string; avatar?: string }): Promise<User> => {
  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user');
  }

  return data.user;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Initialize authentication on app start
export const initializeAuth = async (): Promise<User | null> => {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    // Remove invalid token
    removeAuthToken();
    return null;
  }
};

// Super Admin Approval Functions
export interface PendingUser extends User {
  approvalStatus: ApprovalStatus;
  employeeId: string;
}

// Get pending approvals for super admin
export const getPendingApprovals = async (): Promise<PendingUser[]> => {
  try {
    console.log('🔍 Fetching pending approvals from backend...');
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/pending-approvals`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch pending approvals');
    }
    
    console.log(`📋 Fetched ${data.data.length} pending approvals from backend`);
    return data.data;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

// Approve a user
export const approveUser = async (userId: string): Promise<void> => {
  try {
    console.log(`✅ Approving user: ${userId}`);
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/approve-user/${userId}`, {
      method: 'POST'
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve user');
    }
    
    console.log(`✅ User ${userId} approved successfully and added to Azure container`);
    
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

// Reject a user
export const rejectUser = async (userId: string, reason: string): Promise<void> => {
  try {
    console.log(`❌ Rejecting user: ${userId} with reason: ${reason}`);
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/reject-user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject user');
    }
    
    console.log(`❌ User ${userId} rejected successfully and removed from portal: ${reason}`);
    
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }
};

// Social Media API calls
export const fetchSocialMediaPosts = async (): Promise<SocialMediaPost[]> => {
  try {
    console.log('🔍 Fetching social media posts from backend...');
    
    const response = await fetch(`${API_BASE_URL}/social-media/posts`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.count} social media posts`);
    return data.data;
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    // Return empty array as fallback
    return [];
  }
};

export const fetchRedditPosts = async (): Promise<SocialMediaPost[]> => {
  try {
    console.log('📱 Fetching Reddit posts from backend...');
    
    const response = await fetch(`${API_BASE_URL}/social-media/reddit`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.count} Reddit posts`);
    return data.data;
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
};

export const fetchNewsPosts = async (): Promise<SocialMediaPost[]> => {
  try {
    console.log('📰 Fetching news posts from backend...');
    
    const response = await fetch(`${API_BASE_URL}/social-media/news`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.count} news posts`);
    return data.data;
  } catch (error) {
    console.error('Error fetching news posts:', error);
    return [];
  }
};

export const fetchMockSocialPosts = async (): Promise<SocialMediaPost[]> => {
  try {
    console.log('🎭 Fetching mock social media posts...');
    
    const response = await fetch(`${API_BASE_URL}/social-media/mock`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.count} mock posts`);
    return data.data;
  } catch (error) {
    console.error('Error fetching mock posts:', error);
    return [];
  }
};

