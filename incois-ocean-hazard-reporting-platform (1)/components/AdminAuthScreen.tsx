import React, { useState } from 'react';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { Role } from '../types';

interface AdminAuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string, role: Role, employeeId: string) => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
  onBack: () => void;
}

const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({ 
  onLogin, 
  onRegister, 
  error, 
  setError, 
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.Official);
  const [employeeId, setEmployeeId] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 12) errors.push('Password must be at least 12 characters long');
    if (!/[a-z]/.test(password)) errors.push('Must contain at least one lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
    if (!/\d/.test(password)) errors.push('Must contain at least one number');
    if (!/[@$!%*?&]/.test(password)) errors.push('Must contain at least one special character (@$!%*?&)');
    return errors;
  };

  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email.endsWith('.gov.in')) {
      errors.push('Government email must end with .gov.in');
    }
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isRegister) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isRegister) {
      const emailErrors = validateEmail(value);
      if (emailErrors.length > 0) {
        setError(emailErrors[0]);
      } else {
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      if (!email.trim() || !password.trim() || !name.trim() || !employeeId.trim()) return;
      
      const emailErrors = validateEmail(email);
      if (emailErrors.length > 0) {
        setError(emailErrors[0]);
        return;
      }

      const passwordValidationErrors = validatePassword(password);
      if (passwordValidationErrors.length > 0) {
        setPasswordErrors(passwordValidationErrors);
        return;
      }

      setIsLoading(true);
      await onRegister(email, password, name, role, employeeId);
      setIsLoading(false);
    } else {
      // For login, no email domain validation - allow any email
      if (!email.trim() || !password.trim()) return;

      setIsLoading(true);
      await onLogin(email, password);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-slide-in">
          <button 
            onClick={onBack}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 font-poppins font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            🏠 Back to Portal Selection
          </button>
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-float shadow-2xl">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 font-raleway mb-2">🔐 Government Portal</h1>
          <p className="text-red-700 text-lg font-nunito">Secure access for authorized personnel</p>
        </div>
        
        <div className="bg-gradient-to-br from-white/90 to-orange-50/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-orange-200/50 animate-bounce-in">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 font-nunito">
            {isRegister ? '🚀 Register Government Account' : '🔐 Government Sign In'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                📧 {isRegister ? 'Government Email Address' : 'Email Address'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="block w-full bg-white/80 border-2 border-orange-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-lg transition-all font-poppins"
                placeholder={isRegister ? "your.name@ministry.gov.in" : "Enter your email address"}
                required
              />
              {isRegister && (
                <p className="mt-3 text-sm text-orange-600 font-poppins bg-orange-50 p-2 rounded-lg">
                  🏛️ Must be a valid .gov.in email address for new registrations
                </p>
              )}
            </div>

            {isRegister && (
              <>
                <div>
                  <label htmlFor="name" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                    👤 Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full bg-white/80 border-2 border-orange-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-lg transition-all font-poppins"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="employeeId" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                    🆔 Employee ID
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="block w-full bg-white/80 border-2 border-orange-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-lg transition-all font-poppins"
                    placeholder="Enter your employee ID"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-base font-semibold text-gray-700 mb-3 font-nunito">
                    👑 Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="block w-full bg-white/80 border-2 border-orange-200 rounded-2xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-lg transition-all font-poppins"
                  >
                    <option value={Role.Official}>🏛️ Government Official</option>
                    <option value={Role.Analyst}>📊 Data Analyst</option>
                  </select>
                  <p className="mt-3 text-sm text-orange-600 font-poppins">
                    👥 Select your role in the organization
                  </p>
                </div>
              </>
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
                className="block w-full bg-white/80 border-2 border-orange-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-lg transition-all font-poppins"
                placeholder={isRegister ? "Create a secure password (min 12 chars)" : "Enter your password"}
                required
              />
              {isRegister && (
                <p className="mt-3 text-sm text-orange-600 font-poppins bg-orange-50 p-2 rounded-lg">
                  🔐 Minimum 12 characters with uppercase, lowercase, number and special character
                </p>
              )}
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
            
            {error && <p className="text-base text-red-600 text-center animate-shake font-poppins bg-red-50 p-3 rounded-xl border border-red-200">⚠️ {error}</p>}

            <div>
              <Button type="submit" variant="primary" className="w-full bg-amber-500 hover:bg-amber-400 focus:ring-amber-500" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : (isRegister ? 'Register Account' : 'Sign In')}
              </Button>
            </div>
          </form>
          
          <p className="text-base text-gray-600 text-center mt-8 font-poppins">
            {isRegister ? 'Already have a government account?' : "Need to register a government account?"}
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setPasswordErrors([]);
                setError(null);
              }} 
              className="font-bold text-orange-600 hover:text-orange-700 ml-2 transition-colors"
            >
              {isRegister ? '🔐 Sign In' : '🚀 Register'}
            </button>
          </p>

          <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
            <div className="flex items-start">
              <span className="text-2xl mr-4 animate-pulse">🛡️</span>
              <div>
                <p className="text-base text-orange-700 font-bold font-nunito mb-2">🔒 Security Notice</p>
                <p className="text-sm text-gray-600 font-poppins leading-relaxed">
                  This portal is restricted to authorized government personnel only. 
                  All access attempts are logged and monitored for security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthScreen;
