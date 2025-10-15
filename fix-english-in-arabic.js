import fs from 'fs';
import { arabicTranslations } from './curated-arabic-translations.js';

// Check if a string is English (simple heuristic)
function isEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Check if string contains mostly ASCII characters (English)
  const asciiCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  return asciiCount / totalChars > 0.5;
}

// Function to get all nested values
function findEnglishValues(obj, path = '') {
  const results = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      results.push(...findEnglishValues(value, currentPath));
    } else if (typeof value === 'string' && isEnglish(value)) {
      results.push({ path: currentPath, value });
    }
  }
  
  return results;
}

// Function to set a nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Read Arabic admin.json
const arAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/ar/admin.json', 'utf8'));

// Find all English values
const englishValues = findEnglishValues(arAdmin);

console.log(`Found ${englishValues.length} English values in ar/admin.json`);
console.log('\nApplying curated Arabic translations...');

let translatedCount = 0;
const needsTranslation = [];

for (const { path, value } of englishValues) {
  if (arabicTranslations[value]) {
    setNestedValue(arAdmin, path, arabicTranslations[value]);
    translatedCount++;
  } else {
    needsTranslation.push({ path, value });
  }
}

// Write updated file
fs.writeFileSync(
  'client/src/i18n/locales/ar/admin.json', 
  JSON.stringify(arAdmin, null, 2), 
  'utf8'
);

console.log(`✅ Processed ${englishValues.length} English values`);
console.log(`📝 Translated: ${translatedCount}`);
console.log(`⚠️  Still needs translation: ${needsTranslation.length}`);

if (needsTranslation.length > 0) {
  console.log('\n⚠️  All keys needing translation:');
  needsTranslation.forEach(({ path, value }) => {
    console.log(`   ${path}: "${value}"`);
  });
}

// Save unique untranslated values to file for bulk translation
const uniqueValues = [...new Set(needsTranslation.map(({value}) => value))];
fs.writeFileSync('untranslated-values.txt', uniqueValues.join('\n'), 'utf8');
console.log(`\n📝 Saved ${uniqueValues.length} unique untranslated values to untranslated-values.txt`);
