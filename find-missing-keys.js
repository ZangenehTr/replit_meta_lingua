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

// Get language from command line (default to 'fa')
const targetLang = process.argv[2] || 'fa';
const langName = targetLang === 'fa' ? 'Farsi' : targetLang === 'ar' ? 'Arabic' : targetLang;

// Read JSON files
const enAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/admin.json', 'utf8'));
const targetAdmin = JSON.parse(fs.readFileSync(`client/src/i18n/locales/${targetLang}/admin.json`, 'utf8'));

// Extract all keys
const enKeys = extractKeys(enAdmin);
const targetKeys = extractKeys(targetAdmin);

// Find missing keys
const missingKeys = enKeys.filter(key => !targetKeys.includes(key));

console.log(`Total English keys: ${enKeys.length}`);
console.log(`Total ${langName} keys: ${targetKeys.length}`);
console.log(`Missing keys: ${missingKeys.length}`);
console.log('\nMissing keys:');
missingKeys.forEach(key => console.log(key));

// Save to file for reference
const outputFile = `missing-${targetLang}-keys.txt`;
fs.writeFileSync(outputFile, missingKeys.join('\n'), 'utf8');
console.log(`\nMissing keys saved to ${outputFile}`);
