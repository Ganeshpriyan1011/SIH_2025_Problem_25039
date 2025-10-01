import React, { useRef, useEffect, useState } from 'react';
import { Report, Role, User } from '../types';
import { HAZARD_COLORS } from '../constants';
import Button from './common/Button';
import RejectModal from './RejectModal';
import { useLanguage } from '../contexts/LanguageContext';

const ConfidenceMeter = ({ confidence }: { confidence: number }) => {
    const { t } = useLanguage();
    const getColor = () => {
        if (confidence < 40) return 'bg-red-500';
        if (confidence < 75) return 'bg-amber-400';
        return 'bg-green-500';
    }
    const getTextColor = () => {
        if (confidence < 40) return 'text-red-400';
        if (confidence < 75) return 'text-amber-400';
        return 'text-green-400';
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold text-sm text-sky-400">{t('reportList.confidenceScore')}</h4>
                <span className={`text-sm font-bold ${getTextColor()}`}>{confidence}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full ${getColor()}`} 
                    style={{ width: `${confidence}%` }}
                ></div>
            </div>
        </div>
    )
}

const ReportCard: React.FC<{
  report: Report;
  isSelected: boolean;
  onSelect: (report: Report) => void;
  user: User;
  onVerifyReport: (reportId: string) => void;
  onRejectReport: (reportId: string, rejectionReason: string) => void;
}> = ({ report, isSelected, onSelect, user, onVerifyReport, onRejectReport }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const handleReject = async (reason: string) => {
    await onRejectReport(report.id, reason);
  };
  const { t } = useLanguage();
  const hazardColor = HAZARD_COLORS[report.hazard] || 'bg-gray-500'; // Fallback color
  const hazardKey = `hazards.${report.hazard?.replace(/\s/g, '') || 'Other'}`;
  
  return (
    <div
      onClick={() => onSelect(report)}
      className={`p-4 border-l-4 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700/50'}`}
      style={{ borderLeftColor: hazardColor?.replace('bg-', 'var(--tw-color-')?.replace('-500', '-500))') || '#6b7280' }}
    >
      <div className="flex justify-between items-start">
        <div>
            <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${hazardColor}`}>{t(hazardKey)}</span>
            <h3 className="font-bold mt-2 text-white">{report.location.name}</h3>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>{new Date(report.timestamp).toLocaleDateString()}</p>
          <p>{new Date(report.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
      <p className="text-sm text-slate-300 mt-2 line-clamp-2">"{report.summary}"</p>
      {isSelected && (
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg space-y-4">
            <ConfidenceMeter confidence={report.confidence} />
            <div>
              <h4 className="font-semibold text-sm text-sky-400 mb-1">{t('reportList.fullReport')}</h4>
              <p className="text-xs text-slate-300 italic">{report.description}</p>
            </div>
            {report.image && <img src={report.image} alt="Hazard" className="rounded-md max-h-40 w-full object-cover"/>}
            <div className="text-xs flex justify-between items-center text-slate-400">
                <span>{t('reportList.by')}: {report.author} ({t(`roles.${report.role}`)})</span>
                {report.verified && (
                    <span className="flex items-center text-green-400 font-semibold">
                        <ion-icon name="checkmark-circle" className="mr-1"></ion-icon> {t('reportList.verified')}
                    </span>
                )}
                {report.verificationStatus === 'rejected' && (
                    <span className="flex items-center text-red-400 font-semibold">
                        <ion-icon name="close-circle" className="mr-1"></ion-icon> Rejected
                    </span>
                )}
            </div>
            {(user.role?.toLowerCase() !== Role.Citizen.toLowerCase() && 
              report.role?.toLowerCase() === Role.Citizen.toLowerCase() && 
              !report.verified && 
              report.verificationStatus !== 'rejected') && (
                <div className="space-y-2 mt-3">
                    <div className="flex gap-2">
                        <Button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to verify this report? This will mark it as officially confirmed.")) {
                                    onVerifyReport(report.id);
                                }
                            }}
                            variant="primary" 
                            size="sm"
                            className="flex-1"
                        >
                            <ion-icon name="shield-checkmark-outline" className="mr-1"></ion-icon>
                            Verify
                        </Button>
                        <Button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowRejectModal(true);
                            }}
                            variant="secondary" 
                            size="sm"
                            className="flex-1"
                        >
                            <ion-icon name="close-circle-outline" className="mr-1"></ion-icon>
                            Reject
                        </Button>
                    </div>
                    {/* Delete feature removed - Reports can only be rejected to maintain audit trail */}
                </div>
            )}
            {report.verificationStatus === 'rejected' && report.rejectionReason && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h4 className="font-semibold text-sm text-red-400 mb-1">Rejection Reason</h4>
                    <p className="text-xs text-red-300">{report.rejectionReason}</p>
                    {report.verifiedBy && (
                        <p className="text-xs text-red-400/70 mt-1">Rejected by: {report.verifiedBy}</p>
                    )}
                </div>
            )}
        </div>
      )}
      
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={handleReject}
        reportAuthor={report.author}
      />
    </div>
  );
};

const ReportList: React.FC<{
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  user: User;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onVerifyReport: (reportId: string) => void;
  onRejectReport: (reportId: string, rejectionReason: string) => void;
}> = ({ reports, selectedReport, onSelectReport, user, searchTerm, onSearchChange, onVerifyReport, onRejectReport }) => {
  const reportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { t } = useLanguage();

  useEffect(() => {
    if (selectedReport) {
      const selectedElement = reportRefs.current[selectedReport.id];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [selectedReport]);


  return (
    <div>
      <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">
        <h2 className="text-lg font-bold text-white">{t('reportList.title')} ({reports.length})</h2>
        <input
            type="text"
            placeholder={t('reportList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-md p-2 mt-2 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        {reports.map(report => (
          <div key={report.id} ref={el => { reportRefs.current[report.id] = el; }}>
            <ReportCard 
              report={report}
              isSelected={selectedReport?.id === report.id}
              onSelect={onSelectReport}
              user={user}
              onVerifyReport={onVerifyReport}
              onRejectReport={onRejectReport}
            />
          </div>
        ))}
        {reports.length === 0 && <p className="p-4 text-slate-400 text-center">{t('reportList.noReports')}</p>}
      </div>
    </div>
  );
};

export default ReportList;