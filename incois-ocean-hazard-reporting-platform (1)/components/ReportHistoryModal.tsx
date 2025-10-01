import React from 'react';
import { User, Report } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { HAZARD_COLORS, HAZARD_HEX_COLORS } from '../constants';

interface ReportHistoryModalProps {
  user: User;
  reports: Report[];
  onClose: () => void;
}

const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({ user, reports, onClose }) => {
  const { t } = useLanguage();
  const userReports = reports.filter(report => report.author === user.name);

  return (
    <Modal title={t('reportHistory.title')} onClose={onClose} className="max-w-2xl">
      <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {userReports.length > 0 ? (
          <ul className="space-y-4">
            {userReports.map(report => (
              <li key={report.id} className="bg-slate-800 p-4 rounded-lg border-l-4" style={{ borderLeftColor: HAZARD_HEX_COLORS[report.hazard] }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${HAZARD_COLORS[report.hazard]}`}>
                      {t(`hazards.${report.hazard.replace(/\s/g, '')}`)}
                    </span>
                    <h3 className="font-bold mt-2 text-white">{report.location.name}</h3>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{new Date(report.timestamp).toLocaleDateString()}</p>
                    <p>{new Date(report.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-2 italic">"{report.summary}"</p>
                <div className="mt-3 text-right">
                  {report.verified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      <ion-icon name="checkmark-circle" className="mr-1.5"></ion-icon>
                      {t('reportList.verified')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                       <ion-icon name="hourglass-outline" className="mr-1.5"></ion-icon>
                      {t('reportHistory.pending')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-400 py-8">{t('reportHistory.noReports')}</p>
        )}
      </div>
      <div className="bg-slate-800 px-6 py-3 flex justify-end gap-3 rounded-b-lg border-t border-slate-700">
        <Button onClick={onClose} variant="secondary">{t('reportHistory.close')}</Button>
      </div>
    </Modal>
  );
};

export default ReportHistoryModal;
