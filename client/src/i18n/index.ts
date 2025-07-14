import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import en from './locales/en';
import fa from './locales/fa';
import ar from './locales/ar';

// Language detection options
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: detectionOptions,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    resources: {
      en: {
        common: en.common,
        errors: en.errors,
        validation: en.validation,
      },
      fa: {
        common: fa.common,
        errors: fa.errors,
        validation: fa.validation,
      },
      ar: {
        common: ar.common,
        errors: ar.errors,
        validation: ar.validation,
      },
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'validation'],
  });

export default i18n;