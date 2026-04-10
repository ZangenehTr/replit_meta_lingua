import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
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

  const language = (i18n.language as Language) || 'fa';

  // Initialize language detection with fallback to Farsi
  React.useEffect(() => {
    if (!i18n.language || i18n.language === 'dev') {
      i18n.changeLanguage('fa');
      localStorage.setItem('i18nextLng', 'fa');
    }
  }, [i18n]);

  const direction: Direction = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const isRTL = useMemo(() => {
    const rtlLanguages = ['fa', 'ar', 'he', 'ur'];
    return rtlLanguages.includes(language);
  }, [language]);

  const setLanguage = useCallback((newLanguage: Language) => {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
  }, [i18n]);

  useEffect(() => {
    const isRTLLang = RTL_LANGUAGES.includes(language);
    const dir = isRTLLang ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);

    document.body.classList.remove('rtl', 'ltr', 'lang-en', 'lang-fa', 'lang-ar');
    document.body.classList.add(dir, `lang-${language}`);

    if (isRTLLang) {
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
    } else {
      document.body.style.direction = 'ltr';
      document.body.style.textAlign = 'left';
    }
  }, [language]);

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