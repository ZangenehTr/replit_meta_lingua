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
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('meta-lingua-language', lang);
    document.documentElement.dir = getTextDirection(lang);
    document.documentElement.lang = lang;
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