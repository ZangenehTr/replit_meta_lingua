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

  // Get current language from i18n
  const storedLanguage = localStorage.getItem('i18nextLng');
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
    console.log(`Setting language to: ${newLanguage}`);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);

    const isRTLLang = RTL_LANGUAGES.includes(newLanguage);

    // Update document attributes immediately
    document.documentElement.setAttribute('dir', isRTLLang ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLanguage);

    // Update body classes with full RTL enforcement
    document.body.classList.remove('rtl', 'ltr', 'lang-en', 'lang-fa', 'lang-ar');

    if (isRTLLang) {
      document.body.classList.add('rtl', `lang-${newLanguage}`);
      // Force all elements to be RTL
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
    } else {
      document.body.classList.add('ltr', `lang-${newLanguage}`);
      document.body.style.direction = 'ltr';
      document.body.style.textAlign = 'left';
    }

    console.log(`Applied ${isRTLLang ? 'RTL' : 'LTR'} styles for ${newLanguage}`);
    // Force re-render of components that depend on language
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
  }, [i18n]);

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

    // Apply language-specific CSS class
    document.body.classList.remove('lang-en', 'lang-fa', 'lang-ar');
    document.body.classList.add(`lang-${language}`);
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