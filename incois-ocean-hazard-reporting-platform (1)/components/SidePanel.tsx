import React, { useState } from 'react';
import { Report, SocialMediaPost, HazardType, User } from '../types';
import ReportList from './ReportList';
import SocialFeed from './SocialFeed';
import FilterPanel from './FilterPanel';
import Analytics from './Analytics';
import { Role } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidePanelProps {
  reports: Report[];
  socialPosts: SocialMediaPost[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  activeFilters: Set<HazardType>;
  onFilterChange: (hazard: HazardType) => void;
  user: User;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onVerifyReport: (reportId: string) => void;
  onRejectReport: (reportId: string, rejectionReason: string) => void;
}

type Tab = 'reports' | 'social' | 'filters' | 'analytics';

const SidePanel: React.FC<SidePanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const TabButton = ({ tabId, iconName, labelKey }: { tabId: Tab; iconName: string; labelKey: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex-1 p-3 text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-1
        ${activeTab === tabId ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
      title={t(labelKey)}
    >
        <ion-icon name={iconName}></ion-icon>
        {!isCollapsed && <span>{t(labelKey)}</span>}
    </button>
  );

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-[380px]'} bg-slate-800/80 backdrop-blur-sm border-l border-slate-700 flex flex-col h-full transition-all duration-300`}>
      {/* Collapse Toggle Button */}
      <div className="flex items-center justify-between p-2 border-b border-slate-700/50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          <ion-icon name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'}></ion-icon>
        </button>
        {!isCollapsed && (
          <div className="text-sm font-medium text-slate-300 text-center">
            Control Panel
          </div>
        )}
      </div>
      
      <div className={`flex ${isCollapsed ? 'flex-col' : ''} border-b border-slate-700`}>
        <TabButton tabId="reports" iconName="list-outline" labelKey="sidePanel.reports" />
        <TabButton tabId="social" iconName="at-outline" labelKey="sidePanel.socialFeed" />
        <TabButton tabId="filters" iconName="filter-outline" labelKey="sidePanel.filters" />
        {(props.user.role?.toLowerCase() === Role.Analyst.toLowerCase() || props.user.role?.toLowerCase() === Role.Official.toLowerCase()) && (
          <TabButton tabId="analytics" iconName="stats-chart-outline" labelKey="sidePanel.analytics" />
        )}
      </div>

      <div className={`flex-grow overflow-y-auto custom-scrollbar relative ${isCollapsed ? 'hidden' : ''}`}>
        {activeTab === 'reports' && (
          <ReportList 
            reports={props.reports} 
            selectedReport={props.selectedReport}
            onSelectReport={props.onSelectReport}
            user={props.user}
            searchTerm={props.searchTerm}
            onSearchChange={props.onSearchChange}
            onVerifyReport={props.onVerifyReport}
            onRejectReport={props.onRejectReport}
          />
        )}
        {activeTab === 'social' && <SocialFeed posts={props.socialPosts} />}
        {activeTab === 'filters' && (
          <FilterPanel 
            activeFilters={props.activeFilters}
            onFilterChange={props.onFilterChange}
          />
        )}
        {activeTab === 'analytics' && (props.user.role?.toLowerCase() === Role.Analyst.toLowerCase() || props.user.role?.toLowerCase() === Role.Official.toLowerCase()) && (
            <Analytics reports={props.reports} user={props.user} />
        )}
      </div>
    </aside>
  );
};

export default SidePanel;