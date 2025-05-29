import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Language, translations, getTextDirection } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('meta-lingua-language') as Language;
    if (savedLang && ['en', 'fa', 'ar'].includes(savedLang)) {
      setCurrentLanguage(savedLang);
      const direction = getTextDirection(savedLang);
      document.documentElement.dir = direction;
      document.documentElement.lang = savedLang;
      
      // Apply appropriate font and styling based on language
      if (direction === 'rtl') {
        document.body.style.fontFamily = "'Almarai', 'Tahoma', 'Arial', sans-serif";
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.style.fontFamily = "'Inter', 'Arial', sans-serif";
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('meta-lingua-language', lang);
    const direction = getTextDirection(lang);
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
    
    // Apply appropriate font and styling based on language
    if (direction === 'rtl') {
      document.body.style.fontFamily = "'Almarai', 'Tahoma', 'Arial', sans-serif";
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.style.fontFamily = "'Inter', 'Arial', sans-serif";
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const direction = getTextDirection(currentLanguage);
  const isRTL = direction === 'rtl';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage, direction]);

  const value = {
    currentLanguage,
    setLanguage,
    t,
    direction,
    isRTL
  };

  return React.createElement(
    LanguageContext.Provider,
    { value },
    children
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}