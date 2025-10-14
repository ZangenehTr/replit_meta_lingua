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

// Import frontdesk namespace
import enFrontdesk from './locales/en/frontdesk.json';
import faFrontdesk from './locales/fa/frontdesk.json';
import arFrontdesk from './locales/ar/frontdesk.json';

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

// Import linguaquest namespace
import enLinguaquest from './locales/en/linguaquest.json';
import faLinguaquest from './locales/fa/linguaquest.json';
import arLinguaquest from './locales/ar/linguaquest.json';

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
    fallbackLng: 'fa',
    debug: false,
    returnNull: false,
    returnEmptyString: false,
    load: 'languageOnly',
    
    // Prevent raw keys from showing - return fallback text or key without namespace
    parseMissingKeyHandler: (key: string) => {
      console.warn(`Missing translation key: ${key}`);
      // Return the last part of the key (after the last dot) as a fallback
      const keyParts = key.split('.');
      return keyParts[keyParts.length - 1];
    },
    
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
        frontdesk: enFrontdesk,
        auth: enAuth,
        callern: enCallern,
        coursePlayer: enCoursePlayer,
        courses: enCourses,
        linguaquest: enLinguaquest,
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
        frontdesk: faFrontdesk,
        auth: faAuth,
        callern: faCallern,
        coursePlayer: faCoursePlayer,
        courses: faCourses,
        linguaquest: faLinguaquest,
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
        frontdesk: arFrontdesk,
        auth: arAuth,
        callern: arCallern,
        coursePlayer: arCoursePlayer,
        courses: arCourses,
        linguaquest: arLinguaquest,
      },
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'validation', 'admin', 'teacher', 'student', 'mentor', 'supervisor', 'callcenter', 'accountant', 'frontdesk', 'auth', 'callern', 'coursePlayer', 'courses', 'linguaquest'],
  });

// Enhanced RTL detection and document direction management
export const isRTLLanguage = (language: string): boolean => {
  return ['fa', 'ar'].includes(language);
};

// Font fallback system for Persian/Arabic languages
export const getFontFamily = (language: string): string => {
  switch (language) {
    case 'fa': 
      return 'Vazir, "Segoe UI Historic", Tahoma, Arial, sans-serif';
    case 'ar': 
      return 'Almarai, "Noto Kufi Arabic", "Segoe UI Historic", Tahoma, Arial, sans-serif';
    default: 
      return 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif';
  }
};

// RTL layout and direction management
export const updateDocumentDirection = (language: string): void => {
  const isRTL = isRTLLanguage(language);
  const htmlElement = document.documentElement;
  
  // Set document direction
  htmlElement.dir = isRTL ? 'rtl' : 'ltr';
  
  // Toggle RTL class for CSS-based styling
  htmlElement.classList.toggle('rtl', isRTL);
  htmlElement.classList.toggle('ltr', !isRTL);
  
  // Update language attribute
  htmlElement.lang = language;
  
  // Apply font family
  const fontFamily = getFontFamily(language);
  document.body.style.fontFamily = fontFamily;
  
  // Update CSS custom properties for dynamic font switching
  document.documentElement.style.setProperty('--font-family', fontFamily);
  document.documentElement.style.setProperty('--text-direction', isRTL ? 'rtl' : 'ltr');
};

// Development-time missing key detection system
const missingKeys = new Set<string>();
let missingKeyCount = 0;

// Enhanced missing key handler with comprehensive logging
export const logMissingKey = (lng: string, ns: string, key: string): void => {
  const fullKey = `${ns}:${key}`;
  
  if (!missingKeys.has(fullKey)) {
    missingKeys.add(fullKey);
    missingKeyCount++;
    
    console.group(`🔍 Missing Translation Key #${missingKeyCount}`);
    console.warn(`Language: ${lng}`);
    console.warn(`Namespace: ${ns}`);
    console.warn(`Key: ${key}`);
    console.warn(`Full Key: ${fullKey}`);
    console.warn(`Route: ${window.location.pathname}`);
    console.warn(`Total Missing Keys: ${missingKeys.size}`);
    console.groupEnd();
    
    // Log missing keys summary periodically
    if (missingKeyCount % 10 === 0) {
      console.group(`📊 Missing Keys Summary (${missingKeys.size} total)`);
      console.table([...missingKeys].sort().map(key => ({ 'Missing Key': key })));
      console.groupEnd();
    }
  }
};

// Runtime validation and missing key detection
i18n.on('missingKey', (lng, ns, key) => {
  const language = Array.isArray(lng) ? lng[0] : lng;
  const namespace = Array.isArray(ns) ? ns[0] : ns;
  logMissingKey(language, namespace, key);
});

// Language change handler with RTL support
i18n.on('languageChanged', (lng) => {
  updateDocumentDirection(lng);
  console.log(`🌍 Language changed to: ${lng} (${isRTLLanguage(lng) ? 'RTL' : 'LTR'})`);
});

// Initial setup on i18n initialization
i18n.on('initialized', () => {
  const currentLang = i18n.language;
  updateDocumentDirection(currentLang);
  console.log(`🚀 i18n initialized with language: ${currentLang}`);
  const namespaces = i18n.options.ns;
  const nsString = Array.isArray(namespaces) ? namespaces.join(', ') : namespaces || 'common';
  console.log(`📝 Available namespaces: ${nsString}`);
  console.log(`🔤 Font family applied: ${getFontFamily(currentLang)}`);
});

// Export utility functions for use across the application
export const getCurrentLanguage = () => i18n.language;
export const getMissingKeys = () => [...missingKeys];
export const getMissingKeyCount = () => missingKeys.size;

// Development tools for debugging
export const i18nDevTools = {
  missingKeys: () => [...missingKeys],
  missingKeyCount: () => missingKeys.size,
  clearMissingKeys: () => {
    missingKeys.clear();
    missingKeyCount = 0;
    console.log('🧹 Missing keys cache cleared');
  },
  exportMissingKeys: () => {
    const keys = [...missingKeys].sort();
    const exportData = {
      timestamp: new Date().toISOString(),
      totalCount: keys.length,
      route: window.location.pathname,
      keys: keys
    };
    console.log('📤 Missing keys export:', exportData);
    return exportData;
  }
};

// Make dev tools available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).i18nDevTools = i18nDevTools;
  console.log('🛠️ i18n dev tools available at window.i18nDevTools');
}

export default i18n;