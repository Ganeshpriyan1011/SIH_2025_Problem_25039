import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PortalSelectionProps {
  onSelectPortal: (portal: 'user' | 'admin') => void;
}

const PortalSelection: React.FC<PortalSelectionProps> = ({ onSelectPortal }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-4 animate-fade-in relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-teal-200/30 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-teal-200/20 to-emerald-200/20 rounded-full animate-pulse"></div>
      </div>
      
      <div className="w-full max-w-6xl relative z-10">
        <div className="text-center mb-20 animate-slide-in">
          <div className="flex items-center justify-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500 rounded-full flex items-center justify-center mr-8 animate-float shadow-2xl">
              <span className="text-4xl">🌊</span>
            </div>
            <div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3 font-raleway tracking-tight">INCOIS</h1>
              <p className="text-teal-700 text-2xl font-semibold font-nunito">Ocean Hazard Reporting Platform</p>
            </div>
          </div>
          <p className="text-gray-700 text-xl max-w-4xl mx-auto leading-relaxed font-poppins">
            🚀 Choose your portal to access the comprehensive ocean hazard monitoring system. 
            Join thousands of users in creating a safer coastal environment through advanced technology.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* User Portal */}
          <div className="bg-gradient-to-br from-white/90 to-cyan-50/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-cyan-200/50 hover:border-cyan-400 transition-all duration-500 group cursor-pointer transform hover:scale-105 hover:shadow-3xl animate-bounce-in"
               onClick={() => onSelectPortal('user')}
               style={{animationDelay: '0.2s'}}>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-300 shadow-xl animate-glow">
                <span className="text-4xl">👥</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 font-nunito">🌊 Citizen Portal</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg font-poppins">
                🚀 For citizens to report ocean hazards, view real-time alerts, and access comprehensive safety information. 
                Join our community in creating safer coastal environments!
              </p>
              <div className="space-y-4 text-base text-gray-600 mb-8 font-poppins">
                <div className="flex items-center justify-center group-hover:text-cyan-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mr-3 animate-pulse"></span>
                  📱 Submit hazard reports with GPS & photos
                </div>
                <div className="flex items-center justify-center group-hover:text-cyan-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mr-3 animate-pulse"></span>
                  🚨 View real-time safety alerts
                </div>
                <div className="flex items-center justify-center group-hover:text-cyan-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mr-3 animate-pulse"></span>
                  🌐 Access multilingual resources (17 languages)
                </div>
                <div className="flex items-center justify-center group-hover:text-cyan-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mr-3 animate-pulse"></span>
                  📶 Offline reporting capabilities
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-600 hover:via-teal-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-raleway tracking-wide">
                🚀 Enter Citizen Portal
              </button>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="bg-gradient-to-br from-white/90 to-orange-50/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-orange-200/50 hover:border-orange-400 transition-all duration-500 group cursor-pointer transform hover:scale-105 hover:shadow-3xl animate-bounce-in"
               onClick={() => onSelectPortal('admin')}
               style={{animationDelay: '0.4s'}}>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-300 shadow-xl animate-glow">
                <span className="text-4xl">🏛️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 font-nunito">🔐 Government Portal</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg font-poppins">
                🎯 For government officials and analysts to verify reports, manage alerts, and coordinate 
                emergency responses with advanced AI-powered analytics.
              </p>
              <div className="space-y-4 text-base text-gray-600 mb-8 font-poppins">
                <div className="flex items-center justify-center group-hover:text-orange-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mr-3 animate-pulse"></span>
                  ✅ Verify and manage citizen reports
                </div>
                <div className="flex items-center justify-center group-hover:text-orange-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mr-3 animate-pulse"></span>
                  📊 Advanced analytics & AI insights
                </div>
                <div className="flex items-center justify-center group-hover:text-orange-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mr-3 animate-pulse"></span>
                  📱 Social media monitoring & NLP
                </div>
                <div className="flex items-center justify-center group-hover:text-orange-600 transition-colors">
                  <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mr-3 animate-pulse"></span>
                  👑 Super admin approval system
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-raleway tracking-wide">
                🔐 Enter Government Portal
              </button>
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <div className="mt-20 bg-gradient-to-r from-cyan-100/80 via-teal-100/80 to-emerald-100/80 backdrop-blur-sm rounded-3xl p-8 animate-slide-in border border-cyan-200/30" style={{ animationDelay: '0.6s' }}>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-6 font-raleway">🎯 Platform Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-base">
              <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                <span className="text-4xl mb-3">🗺️</span>
                <span className="text-gray-700 font-semibold font-nunito">Interactive Maps</span>
              </div>
              <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '1.0s' }}>
                <span className="text-4xl mb-3">🤖</span>
                <span className="text-gray-700 font-semibold font-nunito">AI Analysis</span>
              </div>
              <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '1.2s' }}>
                <span className="text-4xl mb-3">📱</span>
                <span className="text-gray-700 font-semibold font-nunito">Mobile Ready</span>
              </div>
              <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '1.4s' }}>
                <span className="text-4xl mb-3">🔄</span>
                <span className="text-gray-700 font-semibold font-nunito">Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '1.6s' }}>
          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full animate-pulse"></span>
            <span className="w-3 h-3 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
            <span className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></span>
          </div>
          <p className="text-gray-600 text-lg font-poppins mb-2">
            Powered by <span className="font-bold text-transparent bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text">INCOIS</span> • Ministry of Earth Sciences • Government of India
          </p>
          <p className="text-gray-500 text-base font-nunito">
            🌊 Securing India's coastline through technology and community collaboration
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalSelection;
