import React, { useMemo } from 'react';
import { Report, SocialMediaPost, HazardType, Sentiment } from '../types';
import { HAZARD_TYPES, HAZARD_COLORS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsPanelProps {
  reports: Report[];
  socialPosts: SocialMediaPost[];
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ reports, socialPosts }) => {
  const { t } = useLanguage();
  
  const reportStats = useMemo(() => {
    const stats = HAZARD_TYPES.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<HazardType, number>);

    reports.forEach(report => {
      stats[report.hazard]++;
    });

    return Object.entries(stats);
  }, [reports]);

  const socialStats = useMemo(() => {
     const stats = {
         [Sentiment.Positive]: 0,
         [Sentiment.Negative]: 0,
         [Sentiment.Neutral]: 0,
     };
     socialPosts.forEach(post => {
         stats[post.sentiment]++;
     });
     return stats;
  }, [socialPosts]);

  const maxReportCount = Math.max(...reportStats.map(([, count]) => count), 0);
  const totalVerified = reports.filter(r => r.verified).length;

  return (
    <div className="p-4 text-white animate-fadeIn">
      <div className="sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10 -m-4 p-4 mb-4 border-b border-slate-700">
        <h2 className="text-lg font-bold">{t('analyticsPanel.title')}</h2>
        <p className="text-sm text-slate-400">{t('analyticsPanel.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-center">
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-sky-400">{reports.length}</p>
            <p className="text-xs text-slate-400">{t('analyticsPanel.totalReports')}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{totalVerified}</p>
            <p className="text-xs text-slate-400">{t('analyticsPanel.verifiedReports')}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">{t('analyticsPanel.reportsByType')}</h3>
        <div className="space-y-2">
          {reportStats.map(([hazard, count]) => (
            <div key={hazard} className="flex items-center">
              <div className="w-1/3 text-xs truncate pr-2">{t(`hazards.${hazard.replace(/\s/g, '')}`)}</div>
              <div className="w-2/3 flex items-center">
                <div className={`rounded-r-full ${HAZARD_COLORS[hazard as HazardType]}`} style={{ width: maxReportCount > 0 ? `${(count / maxReportCount) * 100}%` : '0%' }}>
                   <span className="text-xs font-bold pl-2 text-white/90">{count > 0 ? count : ''}</span>
                </div>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p className="text-xs text-slate-500 text-center py-2">{t('reportList.noReports')}</p>}
        </div>
      </div>

       <div className="bg-slate-900/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">{t('analyticsPanel.socialSentiment')}</h3>
        <div className="flex justify-around text-center">
            <div>
                <p className="text-xl font-bold text-green-400">{socialStats.Positive}</p>
                <p className="text-xs text-slate-400">{t('analyticsPanel.positive')}</p>
            </div>
             <div>
                <p className="text-xl font-bold text-gray-400">{socialStats.Neutral}</p>
                <p className="text-xs text-slate-400">{t('analyticsPanel.neutral')}</p>
            </div>
             <div>
                <p className="text-xl font-bold text-red-400">{socialStats.Negative}</p>
                <p className="text-xs text-slate-400">{t('analyticsPanel.negative')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;