import React from 'react';
import { HazardType } from '../types';
import { HAZARD_TYPES, HAZARD_COLORS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface FilterPanelProps {
  activeFilters: Set<HazardType>;
  onFilterChange: (hazard: HazardType) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ activeFilters, onFilterChange }) => {
  const { t } = useLanguage();

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-white mb-4">{t('filterPanel.title')}</h2>
      <div className="space-y-2">
        {HAZARD_TYPES.map(hazard => {
          const isActive = activeFilters.has(hazard);
          const hazardKey = `hazards.${hazard.replace(/\s/g, '')}`;
          return (
            <button
              key={hazard}
              onClick={() => onFilterChange(hazard)}
              className={`w-full text-left p-3 rounded-md flex items-center transition-all duration-200 border-2
                ${isActive ? 'bg-slate-700 border-sky-500 text-white' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/50 text-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full mr-3 ${HAZARD_COLORS[hazard]}`}></div>
              <span className="font-medium">{t(hazardKey)}</span>
              <div className="ml-auto">
                {isActive ? <ion-icon name="checkmark-circle" className="text-sky-400"></ion-icon> : <ion-icon name="ellipse-outline" className="text-slate-500"></ion-icon>}
              </div>
            </button>
          );
        })}
      </div>
       <div className="mt-6 text-center">
        <button
          onClick={() => HAZARD_TYPES.forEach(h => activeFilters.has(h) && onFilterChange(h))}
          className="text-sm text-slate-400 hover:text-white hover:underline"
        >
          {t('filterPanel.clearAll')}
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;