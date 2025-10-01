import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';

import en from '../locales/en';
import as from '../locales/as';
import bn from '../locales/bn';
import gu from '../locales/gu';
import hi from '../locales/hi';
import kn from '../locales/kn';
import ks from '../locales/ks';
import kok from '../locales/kok';
import ml from '../locales/ml';
import mni from '../locales/mni';
import mr from '../locales/mr';
import ne from '../locales/ne';
import or from '../locales/or';
import pa from '../locales/pa';
import ta from '../locales/ta';
import te from '../locales/te';
import ur from '../locales/ur';

type Translations = { [key: string]: any };

const translations: { [key: string]: Translations } = {
  en, as, bn, gu, hi, kn, ks, kok, ml, mni, mr, ne, or, pa, ta, te, ur,
};

export const languages: { [key: string]: string } = {
  en: 'English',
  as: 'Assamese (অসমীয়া)',
  bn: 'Bengali (বাংলা)',
  gu: 'Gujarati (ગુજરાતી)',
  hi: 'Hindi (हिन्दी)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ks: 'Kashmiri (كشميري)',
  kok: 'Konkani (कोंکणी)',
  ml: 'Malayalam (മലയാളം)',
  mni: 'Manipuri (মৈতৈলোন্)',
  mr: 'Marathi (मराठी)',
  ne: 'Nepali (नेपाली)',
  or: 'Odia (ଓଡ଼ିଆ)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  ur: 'Urdu (اردو)',
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en');

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result = translations[language];
    try {
      for (const k of keys) {
        result = result[k];
      }
      if (typeof result === 'string') {
        return result;
      }
    } catch (e) {
      // Fallback to English if key not found in current language
      let fallbackResult = translations['en'];
       try {
        for (const k of keys) {
            fallbackResult = fallbackResult[k];
        }
        if (typeof fallbackResult === 'string') {
            return fallbackResult;
        }
       } catch (fallbackError) {
         return key; // Return the key itself if not found in English either
       }
    }
    return key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
