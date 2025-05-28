import { createContext, useContext, useState, useEffect } from 'react';
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
    // Load saved language from localStorage or detect from user preferences
    const savedLang = localStorage.getItem('meta-lingua-language') as Language;
    if (savedLang && ['en', 'fa', 'ar'].includes(savedLang)) {
      setCurrentLanguage(savedLang);
    } else {
      // Detect Persian/Arabic speakers
      const userLang = navigator.language;
      if (userLang.includes('fa') || userLang.includes('persian')) {
        setCurrentLanguage('fa');
      } else if (userLang.includes('ar') || userLang.includes('arabic')) {
        setCurrentLanguage('ar');
      }
    }
  }, []);

  useEffect(() => {
    // Apply direction to document
    const direction = getTextDirection(currentLanguage);
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    
    // Apply font family for Persian
    if (currentLanguage === 'fa') {
      document.documentElement.style.fontFamily = 'Almarai, system-ui, -apple-system, sans-serif';
    } else {
      document.documentElement.style.fontFamily = '';
    }
  }, [currentLanguage]);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('meta-lingua-language', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[currentLanguage][key] || translations.en[key] || key;
  };

  const direction = getTextDirection(currentLanguage);
  const isRTL = direction === 'rtl';

  const value = {
    currentLanguage,
    setLanguage,
    t,
    direction,
    isRTL
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}