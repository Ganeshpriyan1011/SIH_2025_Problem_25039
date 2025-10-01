import React, { useState, useRef, useEffect } from 'react';
import { User, Role } from '../types';
import Button from './common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './common/LanguageSelector';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onReportClick: () => void;
  onProfileClick: () => void;
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onReportClick, onProfileClick, onHistoryClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Debug logging to check user role
  React.useEffect(() => {
    console.log('🔍 Header Debug - Full user object:', user);
    console.log('🔍 Header Debug - User role value:', user.role);
    console.log('🔍 Header Debug - User role type:', typeof user.role);
    console.log('🔍 Header Debug - Role enum values:', Role);
    console.log('🔍 Header Debug - Role.Official:', Role.Official);
    console.log('🔍 Header Debug - Role comparison (user.role === Role.Official):', user.role === Role.Official);
    console.log('🔍 Header Debug - String comparison (String(user.role) === "Official"):', String(user.role) === "Official");
    console.log('🔍 Header Debug - User email:', user.email);
    console.log('🔍 Header Debug - Computed role display name:', getRoleDisplayName(user.role));
    
    // Temporary: Check if user email suggests they should be an official
    if (user.email && (
      user.email.includes('official') || 
      user.email.includes('admin') || 
      user.email.includes('gov') ||
      user.email.includes('incois') ||
      user.email.includes('navy') ||
      user.email.includes('analyst')
    )) {
      console.log('🚨 POTENTIAL ROLE MISMATCH: Email suggests official/analyst role but showing as:', user.role);
    }
  }, [user]);

  // Normalize role value to handle different formats from backend
  const normalizeRole = (role: any): string => {
    if (!role) return 'Citizen';
    
    // Convert to string and normalize
    const roleStr = String(role).trim();
    
    // Handle various possible formats
    switch(roleStr.toLowerCase()) {
      case 'official':
      case 'government_official':
      case 'govt_official':
        return 'Official';
      case 'analyst':
      case 'data_analyst':
        return 'Analyst';
      case 'superadmin':
      case 'super_admin':
      case 'admin':
        return 'SuperAdmin';
      case 'citizen':
      case 'user':
      default:
        return 'Citizen';
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    const normalizedRole = normalizeRole(role);
    console.log('🎨 Badge Color - Normalized role:', normalizedRole);
    
    switch(normalizedRole) {
      case 'Analyst':
        return 'bg-gradient-to-r from-cyan-500 to-teal-500';
      case 'Official':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'SuperAdmin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      case 'Citizen':
      default: 
        return 'bg-gradient-to-r from-emerald-500 to-cyan-500';
    }
  }

  const getRoleDisplayName = (role: Role) => {
    const normalizedRole = normalizeRole(role);
    console.log('📝 Display Name - Normalized role:', normalizedRole);
    
    switch(normalizedRole) {
      case 'Analyst':
        return 'Analyst';
      case 'Official':
        return 'Official';
      case 'SuperAdmin':
        return 'Super Admin';
      case 'Citizen':
      default: 
        return 'Citizen';
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <header className="bg-gradient-to-r from-cyan-100/90 via-teal-100/90 to-emerald-100/90 backdrop-blur-lg border-b border-cyan-200/50 p-4 flex justify-between items-center z-20 shadow-lg">
      <div className="flex items-center">
        <h1 className="text-2xl font-black text-gray-800 tracking-wider font-raleway">🌊 {t('header.title')}</h1>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSelector />
        <Button onClick={onReportClick} variant="primary" size="sm">
            <ion-icon name="add-circle-outline" className="mr-2"></ion-icon>
            {t('header.newReportButton')}
        </Button>
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 hover:bg-white/50 p-3 rounded-2xl transition-all duration-300 hover:shadow-lg">
                {user.avatar ? (
                    <img src={user.avatar} alt="User Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-cyan-300 shadow-lg"/>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center border-2 border-cyan-300 shadow-lg">
                        <span className="text-2xl">👤</span>
                    </div>
                )}
                <div className="text-right">
                    <p className="font-bold text-gray-800 font-nunito">{user.name}</p>
                    <span className={`text-xs px-3 py-1 rounded-full text-white font-semibold shadow-sm ${getRoleBadgeColor(user.role)}`}>{getRoleDisplayName(user.role)}</span>
                </div>
                <span className="text-2xl text-gray-600">🔽</span>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-white/95 to-cyan-50/95 backdrop-blur-lg border border-cyan-200 rounded-2xl shadow-2xl py-2 z-30">
                    <button 
                        onClick={() => { onProfileClick(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-cyan-100/50 flex items-center gap-3 font-poppins font-medium transition-all rounded-xl mx-2"
                    >
                        <span className="text-xl">👤</span>
                        {t('header.profile')}
                    </button>
                    <button 
                        onClick={() => { onHistoryClick(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-cyan-100/50 flex items-center gap-3 font-poppins font-medium transition-all rounded-xl mx-2"
                    >
                        <span className="text-xl">📄</span>
                        {t('header.reportHistory')}
                    </button>
                    <button 
                        onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-red-100/50 flex items-center gap-3 font-poppins font-medium transition-all rounded-xl mx-2"
                    >
                        <span className="text-xl">🚪</span>
                        {t('header.logout')}
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;