import fs from 'fs';

// Function to extract all keys from a nested object
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Read JSON files
const enAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/admin.json', 'utf8'));
const faAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/fa/admin.json', 'utf8'));

// Extract all keys
const enKeys = extractKeys(enAdmin);
const faKeys = extractKeys(faAdmin);

// Find missing keys
const missingKeys = enKeys.filter(key => !faKeys.includes(key));

console.log(`Total English keys: ${enKeys.length}`);
console.log(`Total Farsi keys: ${faKeys.length}`);
console.log(`Missing keys: ${missingKeys.length}`);
console.log('\nMissing keys:');
missingKeys.forEach(key => console.log(key));

// Save to file for reference
fs.writeFileSync('missing-fa-keys.txt', missingKeys.join('\n'), 'utf8');
console.log('\nMissing keys saved to missing-fa-keys.txt');
