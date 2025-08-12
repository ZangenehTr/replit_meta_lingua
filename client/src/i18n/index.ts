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

// Import auth namespace
import enAuth from './locales/en/auth.json';
import faAuth from './locales/fa/auth.json';
import arAuth from './locales/ar/auth.json';

// Import callern namespace
import enCallern from './locales/en/callern.json';
import faCallern from './locales/fa/callern.json';
import arCallern from './locales/ar/callern.json';

// Import coursePlayer namespace
import enCoursePlayer from './locales/en/coursePlayer.json';
import faCoursePlayer from './locales/fa/coursePlayer.json';
import arCoursePlayer from './locales/ar/coursePlayer.json';

// Import courses namespace
import enCourses from './locales/en/courses.json';
import faCourses from './locales/fa/courses.json';
import arCourses from './locales/ar/courses.json';

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
    returnNull: false,
    returnEmptyString: false,
    load: 'languageOnly',
    
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
        auth: enAuth,
        callern: enCallern,
        coursePlayer: enCoursePlayer,
        courses: enCourses,
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
        auth: faAuth,
        callern: faCallern,
        coursePlayer: faCoursePlayer,
        courses: faCourses,
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
        auth: arAuth,
        callern: arCallern,
        coursePlayer: arCoursePlayer,
        courses: arCourses,
      },
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'validation', 'admin', 'teacher', 'student', 'mentor', 'supervisor', 'callcenter', 'accountant', 'auth', 'callern', 'coursePlayer'],
  });

export default i18n;