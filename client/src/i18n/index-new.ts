import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources directly
import enCommon from './locales/en/common.json';
import faCommon from './locales/fa/common.json';

// Debug the loaded resources
console.log('=== I18N SYSTEM INITIALIZATION ===');
console.log('EN Common loaded:', !!enCommon);
console.log('FA Common loaded:', !!faCommon);
console.log('EN Common structure:', Object.keys(enCommon));
console.log('FA Common structure:', Object.keys(faCommon));
console.log('EN navigation keys:', Object.keys((enCommon as any).navigation || {}));
console.log('FA navigation keys:', Object.keys((faCommon as any).navigation || {}));
console.log('EN dashboard key:', (enCommon as any).navigation?.dashboard);
console.log('FA dashboard key:', (faCommon as any).navigation?.dashboard);

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
      },
      fa: {
        common: faCommon,
      },
    },
    
    defaultNS: 'common',
    ns: ['common'],
    keySeparator: '.',
    nsSeparator: ':',
  });

// Test the translations after initialization
i18n.on('initialized', () => {
  console.log('=== I18N INITIALIZED ===');
  console.log('Current language:', i18n.language);
  console.log('Available resources:', Object.keys(i18n.options.resources || {}));
  console.log('EN resources keys:', Object.keys(i18n.options.resources?.en || {}));
  console.log('FA resources keys:', Object.keys(i18n.options.resources?.fa || {}));
  
  // Test translations with different approaches
  console.log('Test 1 - navigation.dashboard:', i18n.t('navigation.dashboard'));
  console.log('Test 2 - common:navigation.dashboard:', i18n.t('common:navigation.dashboard'));
  console.log('Test 3 - direct common access:', i18n.t('navigation.dashboard', { ns: 'common' }));
  
  // Direct resource access test
  const enResources = i18n.options.resources?.en?.common;
  console.log('Direct EN common resource:', enResources);
  console.log('Direct navigation object:', (enResources as any)?.navigation);
  
  console.log('=== I18N TEST COMPLETE ===');
});

export default i18n;