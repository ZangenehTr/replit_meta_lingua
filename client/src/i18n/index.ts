import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import en from './locales/en';
import fa from './locales/fa';
import ar from './locales/ar';

// Import all translation files
import enCommon from './locales/en/common.json';
import faCommon from './locales/fa/common.json';
import arCommon from './locales/ar/common.json';

// Debug resource loading
console.log('Loading translations...');
console.log('English Common navigation keys:', Object.keys(enCommon.navigation || {}));
console.log('Persian Common navigation keys:', Object.keys(faCommon.navigation || {}));

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

import enMentor from './locales/en/mentor.json';
import faMentor from './locales/fa/mentor.json';
import arMentor from './locales/ar/mentor.json';

import enSupervisor from './locales/en/supervisor.json';
import faSupervisor from './locales/fa/supervisor.json';
import arSupervisor from './locales/ar/supervisor.json';

import enCallcenter from './locales/en/callcenter.json';
import faCallcenter from './locales/fa/callcenter.json';
import arCallcenter from './locales/ar/callcenter.json';

import enAccountant from './locales/en/accountant.json';
import faAccountant from './locales/fa/accountant.json';
import arAccountant from './locales/ar/accountant.json';

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
    debug: true,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    resources: {
      en: {
        common: enCommon,
        errors: en.errors,
        validation: en.validation,
        admin: enAdmin,
        teacher: enTeacher,
        student: enStudent,
        mentor: enMentor,
        supervisor: enSupervisor,
        callcenter: enCallcenter,
        accountant: enAccountant,
      },
      fa: {
        common: faCommon,
        errors: fa.errors,
        validation: fa.validation,
        admin: faAdmin,
        teacher: faTeacher,
        student: faStudent,
        mentor: faMentor,
        supervisor: faSupervisor,
        callcenter: faCallcenter,
        accountant: faAccountant,
      },
      ar: {
        common: arCommon,
        errors: ar.errors,
        validation: ar.validation,
        admin: arAdmin,
        teacher: arTeacher,
        student: arStudent,
        mentor: arMentor,
        supervisor: arSupervisor,
        callcenter: arCallcenter,
        accountant: arAccountant,
      },
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'validation', 'admin', 'teacher', 'student', 'mentor', 'supervisor', 'callcenter', 'accountant'],
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;