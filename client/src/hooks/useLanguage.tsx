import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'fa' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const RTL_LANGUAGES = ['fa', 'ar'];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n, t } = useTranslation();
  
  // Force English if no explicit language is set, and clear any cached Persian language
  const storedLanguage = localStorage.getItem('i18nextLng');
  const language = (storedLanguage as Language) || 'en';
  
  // Initialize to English if not explicitly set to another language
  React.useEffect(() => {
    if (!storedLanguage || storedLanguage === 'fa') {
      console.log('Initializing language to English (clearing cached Persian)');
      i18n.changeLanguage('en');
      localStorage.setItem('i18nextLng', 'en');
    }
  }, [i18n, storedLanguage]);
  
  const direction: Direction = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = (lang: Language) => {
    console.log(`Setting language to: ${lang}`);
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  useEffect(() => {
    // Set document direction and language
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
    
    // Add RTL class to body for CSS styling - ONLY for RTL languages
    // Remove any existing direction classes first
    document.body.classList.remove('rtl', 'ltr');
    
    if (isRTL) {
      document.body.classList.add('rtl');
      console.log(`Applied RTL for language: ${language}`);
    } else {
      document.body.classList.add('ltr');
      console.log(`Applied LTR for language: ${language}`);
    }
  }, [language, direction, isRTL]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};