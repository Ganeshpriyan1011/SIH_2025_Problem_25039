import React, { useState, useEffect } from 'react';
import { User, Role, ApprovalStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Button from './common/Button';
import Spinner from './common/Spinner';
import NotificationContainer from './common/NotificationContainer';
import { getPendingApprovals, approveUser, rejectUser, PendingUser } from '../services/backendApiService';
import { useNotifications } from '../hooks/useNotifications';

interface AdminApprovalPageProps {
  user: User;
  onLogout: () => void;
}

const AdminApprovalPage: React.FC<AdminApprovalPageProps> = ({ user, onLogout }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { t } = useLanguage();
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const users = await getPendingApprovals();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setProcessing(userId);
      const user = pendingUsers.find(u => u.id === userId);
      await approveUser(userId);
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
      // Show success notification
      showSuccess(
        'User Approved Successfully!',
        `${user?.name || 'User'} has been approved and can now access the system.`,
        6000
      );
    } catch (error) {
      console.error('Error approving user:', error);
      showError(
        'Approval Failed',
        'Failed to approve user. Please check your connection and try again.',
        8000
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string, reason: string) => {
    try {
      setProcessing(userId);
      const user = pendingUsers.find(u => u.id === userId);
      await rejectUser(userId, reason);

      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setShowRejectModal(null);
      setRejectionReason('');
      
      // Show success notification
      showError(
        'User Registration Rejected',
        `${user?.name || 'User'}'s registration has been rejected. They have been notified via email.`,
        6000
      );
    } catch (error) {
      console.error('Error rejecting user:', error);
      showError(
        'Rejection Failed',
        'Failed to reject user registration. Please check your connection and try again.',
        8000
      );
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.Official:
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      case Role.Analyst:
        return 'bg-gradient-to-r from-cyan-500 to-teal-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-700 mt-4">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-100/90 via-teal-100/90 to-emerald-100/90 backdrop-blur-lg border-b border-cyan-200/50 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-wider font-raleway">🌊 Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage government official and analyst approvals</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <Button onClick={onLogout} variant="secondary" size="sm">
              <ion-icon name="log-out-outline" className="mr-2"></ion-icon>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
            <div className="flex items-center space-x-2 text-gray-600 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full border border-cyan-200">
              <ion-icon name="people-outline"></ion-icon>
              <span className="font-medium">{pendingUsers.length} pending</span>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-cyan-200/50 shadow-lg">
              <ion-icon name="checkmark-circle-outline" className="text-6xl text-emerald-500 mb-4"></ion-icon>
              <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending approvals at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-cyan-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                          <ion-icon name="person-outline" className="text-xl text-white"></ion-icon>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">{pendingUser.name}</h3>
                          <p className="text-gray-600">{pendingUser.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${getRoleBadgeColor(pendingUser.role)}`}>
                          {pendingUser.role}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm bg-cyan-50/50 rounded-lg p-3">
                        <div>
                          <span className="text-gray-600 font-medium">Employee ID:</span>
                          <span className="text-gray-800 ml-2 font-mono font-bold">{pendingUser.employeeId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">Registration Date:</span>
                          <span className="text-gray-800 ml-2 font-semibold">
                            {new Date(pendingUser.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 ml-6">
                      <Button
                        onClick={() => handleApprove(pendingUser.id)}
                        variant="primary"
                        size="sm"
                        disabled={processing === pendingUser.id}
                      >
                        {processing === pendingUser.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <ion-icon name="checkmark-outline" className="mr-2"></ion-icon>
                            Approve
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => setShowRejectModal(pendingUser.id)}
                        variant="danger"
                        size="sm"
                        disabled={processing === pendingUser.id}
                      >
                        <ion-icon name="close-outline" className="mr-2"></ion-icon>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md mx-4 border border-cyan-200/50 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject User Registration</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this user's registration:
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 bg-white/70 border border-cyan-200 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              rows={4}
            />
            
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(showRejectModal, rejectionReason)}
                variant="danger"
                className="flex-1"
                disabled={!rejectionReason.trim() || processing === showRejectModal}
              >
                {processing === showRejectModal ? (
                  <Spinner size="sm" />
                ) : (
                  'Reject User'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </div>
  );
};

export default AdminApprovalPage;
