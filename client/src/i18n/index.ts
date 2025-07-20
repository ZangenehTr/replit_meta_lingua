import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import en from './locales/en';
import fa from './locales/fa';
import ar from './locales/ar';

// Import additional namespaces
import enAdmin from './locales/en/admin.json';
import faAdmin from './locales/fa/admin.json';
import arAdmin from './locales/ar/admin.json';
import enTeacher from './locales/en/teacher.json';
import faTeacher from './locales/fa/teacher.json';
import arTeacher from './locales/ar/teacher.json';
import enStudent from './locales/en/student.json';
import faStudent from './locales/fa/student.json';
import arStudent from './locales/ar/student.json';

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
        admin: enAdmin,
        teacher: enTeacher,
        student: enStudent,
      },
      fa: {
        common: fa.common,
        errors: fa.errors,
        validation: fa.validation,
        admin: faAdmin,
        teacher: faTeacher,
        student: faStudent,
      },
      ar: {
        common: ar.common,
        errors: ar.errors,
        validation: ar.validation,
        admin: arAdmin,
        teacher: arTeacher,
        student: arStudent,
      },
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'validation', 'admin', 'teacher', 'student'],
  });

export default i18n;