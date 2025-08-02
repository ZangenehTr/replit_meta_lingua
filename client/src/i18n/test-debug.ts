// Quick debug file to test i18n loading
import enCommon from './locales/en/common.json';
import faCommon from './locales/fa/common.json';

alert('I18N DEBUG: EN has navigation: ' + !!(enCommon as any).navigation);
console.log('=== I18N DEBUG START ===');
console.log('English common loaded:', !!enCommon);
console.log('English navigation keys:', Object.keys((enCommon as any).navigation || {}));
console.log('Persian common loaded:', !!faCommon);
console.log('Persian navigation keys:', Object.keys((faCommon as any).navigation || {}));
console.log('Sample EN dashboard:', (enCommon as any).navigation?.dashboard);
console.log('Sample FA dashboard:', (faCommon as any).navigation?.dashboard);
console.log('EN Common structure:', Object.keys(enCommon));
console.log('FA Common structure:', Object.keys(faCommon));
console.log('=== I18N DEBUG END ===');

export { enCommon, faCommon };