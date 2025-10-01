import React, { useState, useEffect, useCallback } from 'react';
import { User, Report, SocialMediaPost, HazardType, Role, Notification as NotificationType } from './types';
import { 
  fetchInitialData, 
  submitNewReport as apiSubmitReport, 
  registerUser as apiRegisterUser,
  registerAdmin as apiRegisterAdmin,
  loginUser as apiLoginUser,
  loginAdmin as apiLoginAdmin,
  verifyOTP as apiVerifyOTP,
  updateUser as apiUpdateUser, 
  verifyReportById as apiVerifyReport,
  rejectReportById as apiRejectReport,
  logoutUser as apiLogoutUser,
  initializeAuth,
  fetchSocialMediaPosts
} from './services/backendApiService';
import { summarizeHazardReport } from './services/geminiService';
import { generateSocialMediaPosts } from './services/mockData';
import { OpenSourceSocialService } from './services/openSourceSocialService';

import MapDashboard from './components/MapDashboard';
import AuthScreen from './components/AuthScreen';
import PortalSelection from './components/PortalSelection';
import UserAuthScreen from './components/UserAuthScreen';
import AdminAuthScreen from './components/AdminAuthScreen';
import AdminApprovalPage from './components/AdminApprovalPage';
import ChatbotToggle from './components/ChatbotToggle';
import Spinner from './components/common/Spinner';
import Notification from './components/Notification';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [showOTPVerification, setShowOTPVerification] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [selectedPortal, setSelectedPortal] = useState<'user' | 'admin' | null>(null);
  const { t } = useLanguage();

  const showNotification = (messageKey: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: t(messageKey), type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Loading initial data and social media posts...');
      const { reports: initialReports, socialMediaPosts } = await fetchInitialData();
      setReports(initialReports);
      
      // Load real social media data using the APIs
      console.log('Fetching real social media data...');
      const realSocialData = await OpenSourceSocialService.fetchAllSocialData();
      
      // Combine mock data with real data for better content
      const combinedSocialPosts = [...realSocialData, ...socialMediaPosts];
      console.log(`Loaded ${realSocialData.length} real posts and ${socialMediaPosts.length} mock posts`);
      
      setSocialPosts(combinedSocialPosts);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      showNotification("notifications.loadFail", 'error');
      
      // Fallback to mock data if API fails
      try {
        const mockSocialPosts = generateSocialMediaPosts(10);
        setSocialPosts(mockSocialPosts);
        console.log('Using fallback mock social media data');
      } catch (mockError) {
        console.error("Failed to load mock data:", mockError);
      }
    }
  }, [user, t]);

  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    try {
      const authenticatedUser = await initializeAuth();
      if (authenticatedUser) {
        setUser(authenticatedUser);
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    console.log('User state changed:', user);
    if (user) {
      console.log('User is logged in, loading data...');
      loadData();
    } else {
      console.log('No user, showing auth screen');
    }
  }, [user, loadData]);

  // Simulate live social media feed
  useEffect(() => {
      const interval = setInterval(() => {
          const newPost = generateSocialMediaPosts(1)[0];
      }, 15000); // Add a new post every 15 seconds

      return () => clearInterval(interval);
  }, []);

  // User Portal Handlers (Citizens)
  const handleUserLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting user login for:', email);
      const { user: loggedInUser } = await apiLoginUser(email, password);
      console.log('User login successful, user:', loggedInUser);
      setUser(loggedInUser);
      setAuthError(null);
      setShowOTPVerification(false);
      console.log('User state set, should redirect to dashboard');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('User login failed:', errorMessage);
      setAuthError(errorMessage);
    }
  };
  
  const handleUserRegister = async (email: string, password: string, name: string) => {
    try {
      setPendingEmail(email);
      const result = await apiRegisterUser(email, password, name);
      if (result.requiresVerification) {
        setShowOTPVerification(true);
        setAuthError(null);
        showNotification('Registration successful! Please check your email for verification code.', 'success');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
      // Clear pending email on error
      setPendingEmail('');
    }
  };

  // Admin Portal Handlers (Officials & Analysts)
  const handleAdminLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting admin login for:', email);
      const { user: loggedInUser } = await apiLoginAdmin(email, password);
      console.log('Admin login successful, user:', loggedInUser);
      setUser(loggedInUser);
      setAuthError(null);
      console.log('User state set, should redirect to dashboard');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Admin login failed:', errorMessage);
      setAuthError(errorMessage);
    }
  };
  
  const handleAdminRegister = async (email: string, password: string, name: string, role: Role, employeeId: string) => {
    try {
      const result = await apiRegisterAdmin(email, password, name, role, employeeId);
      
      // Admin registration creates a pending user - they should NOT be logged in
      // They need to wait for super admin approval
      setAuthError(null);
      showNotification('Registration submitted successfully! Your account is pending approval by a super administrator. You will be notified once approved.', 'success');
      
      // Do NOT set user state - user should remain on auth screen until approved
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
    }
  };

  // Legacy handlers for backward compatibility
  const handleLogin = async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await apiLoginUser(email, password);
      setUser(loggedInUser);
      setAuthError(null);
      setShowOTPVerification(false);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
    }
  };
  
  const handleRegister = async (email: string, password: string, name: string, role: Role) => {
    try {
      setPendingEmail(email);
      const result = await apiRegisterUser(email, password, name);
      if (result.requiresVerification) {
        setShowOTPVerification(true);
        setAuthError(null);
        showNotification('Registration successful! Please check your email for verification code.', 'success');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
      // Clear pending email on error
      setPendingEmail('');
    }
  };

  const handleVerifyOTP = async (email: string, otp: string) => {
    try {
      const { user: verifiedUser, token } = await apiVerifyOTP(email, otp);
      setUser(verifiedUser);
      setAuthError(null);
      setShowOTPVerification(false);
      setPendingEmail('');
      showNotification('Email verified successfully! Welcome to the platform.', 'success');
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
    }
  };

  const handleResendOTP = async (email: string) => {
    try {
      // For now, just show a message since resendOTP is not implemented
      setAuthError(null);
      showNotification('Verification code sent to your email.', 'success');
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogoutUser();
      setUser(null);
      setReports([]);
      setSocialPosts([]);
      setAuthError(null);
      setShowOTPVerification(false);
      setPendingEmail('');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  const handleAddReport = async (reportData: {
    hazard: HazardType;
    description: string;
    location: { lat: number; lng: number; name: string };
    image?: string;
  }) => {
    if (!user) return;

    // Generate simple summary without AI to prevent failures
    const summary = `Summary: ${reportData.description.substring(0, 100)}${reportData.description.length > 100 ? '...' : ''}`;

    try {
        const newReport: Report = await apiSubmitReport({
            ...reportData,
            summary,
        });

        setReports(prevReports => [newReport, ...prevReports]);
        showNotification("notifications.submitSuccess");
    } catch (error) {
        console.error("Error submitting report:", error);
        showNotification("notifications.submitFail", 'error');
    }
  };

  const handleUpdateUser = async (userId: string, data: { name?: string; avatar?: string; }) => {
    try {
        const updatedUser = await apiUpdateUser(userId, data);
        setUser(updatedUser);
        showNotification("notifications.profileUpdateSuccess");
    } catch (error) {
        console.error("Failed to update user:", error);
        showNotification("notifications.profileUpdateFail", 'error');
    }
  };

  const handleVerifyReport = async (reportId: string) => {
    if (!user || (user.role?.toLowerCase() !== Role.Official.toLowerCase() && user.role?.toLowerCase() !== Role.Analyst.toLowerCase())) {
        showNotification("You do not have permission to verify reports.", 'error');
        return;
    }
    
    try {
        const updatedReport = await apiVerifyReport(reportId);
        setReports(reports.map(r => r.id === reportId ? updatedReport : r));
        showNotification("notifications.verifySuccess");
    } catch (error) {
        console.error("Failed to verify report:", error);
        showNotification("notifications.verifyFail", 'error');
    }
  };

  const handleRejectReport = async (reportId: string, rejectionReason: string) => {
    try {
      const updatedReport = await apiRejectReport(reportId, rejectionReason);
      setReports(reports.map(r => r.id === reportId ? updatedReport : r));
      showNotification("notifications.rejectSuccess");
    } catch (error) {
      console.error("Failed to reject report:", error);
      showNotification("notifications.rejectFail", 'error');
    }
  };

  // Delete functionality removed - Reports can only be rejected to maintain audit trail

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-white">
        <Spinner size="lg" />
        <span className="ml-4 text-xl">{t('notifications.loading')}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {!user ? (
        <>
          {!selectedPortal ? (
            <PortalSelection onSelectPortal={setSelectedPortal} />
          ) : selectedPortal === 'user' ? (
            <UserAuthScreen 
              onLogin={handleUserLogin} 
              onRegister={handleUserRegister} 
              onVerifyOTP={(otp) => handleVerifyOTP(pendingEmail, otp)}
              onResendOTP={() => handleResendOTP(pendingEmail)}
              error={authError}
              setError={setAuthError}
              showOTPVerification={showOTPVerification}
              setShowOTPVerification={setShowOTPVerification}
              pendingEmail={pendingEmail}
              onBack={() => setSelectedPortal(null)}
            />
          ) : (
            <AdminAuthScreen 
              onLogin={handleAdminLogin} 
              onRegister={handleAdminRegister} 
              error={authError}
              setError={setAuthError}
              onBack={() => setSelectedPortal(null)}
            />
          )}
        </>
      ) : user.role === Role.SuperAdmin ? (
        <>
          {console.log('🔐 Super Admin detected! Role:', user.role, 'Expected:', Role.SuperAdmin)}
          <AdminApprovalPage
            user={user}
            onLogout={handleLogout}
          />
        </>
      ) : (
        <>
          {console.log('👤 Regular user detected! Role:', user.role, 'User:', user.email)}
          <MapDashboard
            user={user}
            onLogout={handleLogout}
            reports={reports}
            socialPosts={socialPosts}
            onAddReport={handleAddReport}
            onVerifyReport={handleVerifyReport}
            onRejectReport={handleRejectReport}
            onUpdateUser={handleUpdateUser}
          />
          <ChatbotToggle reports={reports} />
        </>
      )}
    </div>
  );
};

export default App;