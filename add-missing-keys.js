import fs from 'fs';

// Function to extract all keys from a nested object with their values
function extractKeysWithValues(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, extractKeysWithValues(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  
  return result;
}

// Function to set a nested key in an object
function setNestedKey(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Get language from command line (default to 'ar')
const targetLang = process.argv[2] || 'ar';

// Read JSON files
const enAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/admin.json', 'utf8'));
const targetAdmin = JSON.parse(fs.readFileSync(`client/src/i18n/locales/${targetLang}/admin.json`, 'utf8'));

// Extract all keys with values
const enKeysWithValues = extractKeysWithValues(enAdmin);
const targetKeysWithValues = extractKeysWithValues(targetAdmin);

// Find missing keys
const missingKeys = Object.keys(enKeysWithValues).filter(key => !(key in targetKeysWithValues));

console.log(`Found ${missingKeys.length} missing keys in ${targetLang}/admin.json`);
console.log('Adding missing keys with English values as placeholders...');

// Add missing keys to target object
let addedCount = 0;
for (const key of missingKeys) {
  setNestedKey(targetAdmin, key, enKeysWithValues[key]);
  addedCount++;
}

// Write updated file
fs.writeFileSync(
  `client/src/i18n/locales/${targetLang}/admin.json`, 
  JSON.stringify(targetAdmin, null, 2), 
  'utf8'
);

console.log(`✅ Added ${addedCount} keys to ${targetLang}/admin.json`);
console.log(`Total keys in ${targetLang}/admin.json: ${Object.keys(extractKeysWithValues(targetAdmin)).length}`);
