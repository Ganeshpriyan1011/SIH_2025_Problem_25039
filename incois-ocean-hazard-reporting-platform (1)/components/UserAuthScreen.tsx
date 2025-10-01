import React, { useState } from 'react';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { useLanguage } from '../contexts/LanguageContext';

interface UserAuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onVerifyOTP: (otp: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
  showOTPVerification: boolean;
  setShowOTPVerification: (show: boolean) => void;
  pendingEmail: string;
  onBack: () => void;
}

const UserAuthScreen: React.FC<UserAuthScreenProps> = ({ 
  onLogin, 
  onRegister, 
  onVerifyOTP, 
  onResendOTP, 
  error, 
  setError, 
  showOTPVerification, 
  setShowOTPVerification,
  pendingEmail,
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { t } = useLanguage();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[a-z]/.test(password)) errors.push('Must contain at least one lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
    if (!/\d/.test(password)) errors.push('Must contain at least one number');
    if (!/[@$!%*?&]/.test(password)) errors.push('Must contain at least one special character (@$!%*?&)');
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isRegister) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showOTPVerification) {
      if (!otp.trim() || otp.length !== 6) return;
      setIsLoading(true);
      await onVerifyOTP(otp);
      setIsLoading(false);
      return;
    }

    if (isRegister) {
      if (!email.trim() || !password.trim() || !name.trim()) return;
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        return;
      }
      setIsLoading(true);
      await onRegister(email, password, name);
      setIsLoading(false);
    } else {
      if (!email.trim() || !password.trim()) return;
      setIsLoading(true);
      await onLogin(email, password);
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    await onResendOTP();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-slide-in">
          <button 
            onClick={onBack}
            className="inline-flex items-center text-cyan-600 hover:text-cyan-700 mb-6 font-poppins font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            🏠 Back to Portal Selection
          </button>
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-float shadow-2xl">
            <span className="text-3xl">👥</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 font-raleway mb-2">🌊 Citizen Portal</h1>
          <p className="text-teal-700 text-lg font-nunito">Report hazards and stay informed about ocean safety</p>
        </div>
        
        <div className="bg-gradient-to-br from-white/90 to-cyan-50/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-cyan-200/50 animate-bounce-in">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 font-nunito">
            {showOTPVerification ? '📧 Verify Your Email' : (isRegister ? '🚀 Create Account' : '🔐 Sign In')}
          </h2>
          
          {showOTPVerification ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-6 font-poppins text-lg">
                  📱 We've sent a 6-digit verification code to <strong className="text-cyan-700">{pendingEmail}</strong>
                </p>
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                  🔢 Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full bg-white/80 border-2 border-cyan-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-center text-2xl tracking-widest font-bold shadow-lg transition-all"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              
              {error && <p className="text-sm text-red-400 text-center animate-shake">{error}</p>}

              <div>
                <Button type="submit" variant="primary" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Spinner size="sm" /> : 'Verify Email'}
                </Button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-base text-cyan-600 hover:text-cyan-700 disabled:opacity-50 font-poppins font-medium transition-colors"
                >
                  📨 Didn't receive the code? Resend
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                  📧 Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-white/80 border-2 border-cyan-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-lg transition-all font-poppins"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="name" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                    👤 Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full bg-white/80 border-2 border-cyan-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-lg transition-all font-poppins"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                  🔒 Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="block w-full bg-white/80 border-2 border-cyan-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-lg transition-all font-poppins"
                  placeholder={isRegister ? "Create a strong password" : "Enter your password"}
                  required
                />
                {isRegister && passwordErrors.length > 0 && (
                  <div className="mt-4 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                    <p className="font-semibold mb-2 font-nunito">🔐 Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1 font-poppins">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {error && <p className="text-sm text-red-400 text-center animate-shake">{error}</p>}

              <div>
                <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : (isRegister ? 'Create Account' : 'Sign In')}
                </Button>
              </div>
            </form>
          )}
          
          {!showOTPVerification && (
            <p className="text-base text-gray-600 text-center mt-8 font-poppins">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setPasswordErrors([]);
                  setError(null);
                }} 
                className="font-bold text-cyan-600 hover:text-cyan-700 ml-2 transition-colors"
              >
                {isRegister ? '🔐 Sign In' : '🚀 Create Account'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAuthScreen;
