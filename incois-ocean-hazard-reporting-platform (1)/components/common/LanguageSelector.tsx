import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, languages } from '../../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-black hover:bg-gray-100 p-2 rounded-md transition-colors"
      >
        {/* FIX: Replaced 'class' with 'className' to align with React's JSX syntax. */}
        <ion-icon name="language-outline" className="text-xl text-black"></ion-icon>
        <span className="text-sm font-medium uppercase text-black">{language}</span>
        {/* FIX: Replaced 'class' with 'className' to align with React's JSX syntax. */}
        <ion-icon name="chevron-down-outline" className="text-sm text-black"></ion-icon>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-60 overflow-y-auto custom-scrollbar">
          <ul>
            {Object.entries(languages).map(([code, name]) => (
              <li key={code}>
                <button
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    language === code ? 'bg-cyan-100 text-gray-900' : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
