import React, { useState, useMemo } from 'react';
import { User, Report, SocialMediaPost, HazardType } from '../types';
import Header from './Header';
import InteractiveMap from './InteractiveMap';
import ReportForm from './ReportForm';
import SidePanel from './SidePanel';
import ProfileModal from './ProfileModal';
import ReportHistoryModal from './ReportHistoryModal';

interface MapDashboardProps {
  user: User;
  onLogout: () => void;
  reports: Report[];
  socialPosts: SocialMediaPost[];
  onAddReport: (reportData: {
    hazard: HazardType;
    description: string;
    location: { lat: number; lng: number; name: string };
    image?: string;
  }) => void;
  onVerifyReport: (reportId: string) => void;
  onRejectReport: (reportId: string, rejectionReason: string) => void;
  onUpdateUser: (userId: string, data: { name?: string, avatar?: string }) => void;
}

const MapDashboard: React.FC<MapDashboardProps> = ({ user, onLogout, reports, socialPosts, onAddReport, onVerifyReport, onRejectReport, onUpdateUser }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<HazardType>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const finalReports = useMemo(() => {
    let filtered = reports;

    // Apply search term
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(lowercasedFilter) ||
        report.location.name.toLowerCase().includes(lowercasedFilter) ||
        report.hazard.toLowerCase().includes(lowercasedFilter)
      );
    }

    // Apply hazard type filters
    if (activeFilters.size > 0) {
      filtered = filtered.filter(report => activeFilters.has(report.hazard));
    }

    return filtered;
  }, [reports, searchTerm, activeFilters]);

  const handleFilterChange = (hazard: HazardType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(hazard)) {
        newFilters.delete(hazard);
      } else {
        newFilters.add(hazard);
      }
      return newFilters;
    });
  };
  
  const handleSelectReport = (report: Report | null) => {
    setSelectedReport(report);
  };

  const handleSaveProfile = async (data: { name: string; avatar?: string }) => {
    await onUpdateUser(user.id, data);
    setIsProfileModalOpen(false);
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        user={user} 
        onLogout={onLogout} 
        onReportClick={() => setIsReportModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onHistoryClick={() => setIsHistoryModalOpen(true)}
      />
      <main className="flex-grow flex overflow-hidden">
        <div className="flex-grow relative">
          <InteractiveMap 
            reports={finalReports} 
            socialPosts={socialPosts}
            onSelectReport={handleSelectReport}
            selectedReport={selectedReport}
          />
        </div>
        <SidePanel 
          reports={finalReports}
          socialPosts={socialPosts}
          selectedReport={selectedReport}
          onSelectReport={handleSelectReport}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          user={user}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onVerifyReport={onVerifyReport}
          onRejectReport={onRejectReport}
        />
      </main>
      {isReportModalOpen && (
        <ReportForm
          onSubmit={onAddReport}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
      {isProfileModalOpen && (
        <ProfileModal
            user={user}
            onClose={() => setIsProfileModalOpen(false)}
            onSave={handleSaveProfile}
        />
      )}
      {isHistoryModalOpen && (
        <ReportHistoryModal
            user={user}
            reports={reports}
            onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MapDashboard;