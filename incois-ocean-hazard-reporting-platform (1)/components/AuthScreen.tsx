import React, { useState } from 'react';
import { Role } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string, role: Role) => Promise<void>;
  onVerifyOTP: (otp: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
  showOTPVerification: boolean;
  setShowOTPVerification: (show: boolean) => void;
  pendingEmail: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onLogin, 
  onRegister, 
  onVerifyOTP, 
  onResendOTP, 
  error, 
  setError, 
  showOTPVerification, 
  setShowOTPVerification,
  pendingEmail
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.Citizen);
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
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Must contain at least one special character');
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
      await onRegister(email, password, name, role);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAA2CAYAAAAA/e5+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGQzYxRUQ4NzNBOTgxMUU5QUFDNUY3NTlDNzYxQTE4MSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGQzYxRUQ4ODNBOTgxMUU5QUFDNUY3NTlDNzYxQTE4MSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkZDNjFFRDg1M0E5ODExRTlBQUM1Rjc1OUM3NjFBMTgxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkZDNjFFRDg2M0E5ODExRTlBQUM1Rjc1OUM3NjFBMTgxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+D82g8AAAB+RJREFUeNrsnFtsFFUY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" alt="INCOIS Logo" className="h-20 mx-auto mb-4"/>
            <h1 className="text-3xl font-bold text-white">{t('auth.mainTitle')}</h1>
            <p className="text-slate-400 mt-2">{t('auth.subtitle')}</p>
        </div>
        
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
          <h2 className="text-xl font-bold text-center text-white mb-6">
            {showOTPVerification ? 'Verify Your Email' : (isRegister ? t('auth.createAccountTitle') : t('auth.loginTitle'))}
          </h2>
          
          {showOTPVerification ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-slate-300 mb-4">
                  We've sent a 6-digit verification code to <strong>{pendingEmail}</strong>
                </p>
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-300">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-center text-2xl tracking-widest"
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
                  className="text-sm text-sky-400 hover:text-sky-300 disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder={isRegister ? "Create a strong password" : "Enter your password"}
                  required
                />
                {isRegister && passwordErrors.length > 0 && (
                  <div className="mt-2 text-xs text-red-400">
                    <p className="font-medium">Password requirements:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                    {t('auth.roleLabel')}
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={Role.Citizen}>{t('roles.Citizen')}</option>
                    <option value={Role.Official}>{t('roles.Official')}</option>
                    <option value={Role.Analyst}>{t('roles.Analyst')}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose your role: Citizens can report hazards, Officials and Analysts can verify reports
                  </p>
                </div>
              )}
              
              {error && <p className="text-sm text-red-400 text-center animate-shake">{error}</p>}

              <div>
                <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : (isRegister ? t('auth.registerButton') : t('auth.loginButton'))}
                </Button>
              </div>
            </form>
          )}
          
          {!showOTPVerification && (
            <p className="text-sm text-slate-400 text-center mt-6">
              {isRegister ? t('auth.alreadyAccount') : t('auth.noAccount')}
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setPasswordErrors([]);
                  setError(null);
                }} 
                className="font-semibold text-sky-400 hover:text-sky-300 ml-2"
              >
                {isRegister ? t('auth.loginTitle') : t('auth.registerButton')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;