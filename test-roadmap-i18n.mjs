#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Roadmap Designer i18n Configuration...\n');

// Load the admin.json file
const adminJsonPath = path.join(__dirname, 'client/src/i18n/locales/fa/admin.json');
const adminJson = JSON.parse(fs.readFileSync(adminJsonPath, 'utf8'));

// Check if roadmap object exists
if (!adminJson.roadmap) {
  console.error('❌ ERROR: roadmap object not found in admin.json');
  process.exit(1);
}

// List of required keys for the milestone dialog
const requiredKeys = [
  'addMilestone',
  'title',
  'description',
  'weekNumber',
  'primarySkill',
  'milestoneTitlePlaceholder',
  'milestoneDescriptionPlaceholder',
  'fields.title',
  'fields.description'
];

console.log('Checking required translation keys for milestone dialog:\n');

let missingKeys = [];
let foundKeys = [];

requiredKeys.forEach(key => {
  if (key.includes('.')) {
    // Handle nested keys
    const parts = key.split('.');
    let value = adminJson.roadmap;
    for (const part of parts) {
      if (value && value[part]) {
        value = value[part];
      } else {
        value = null;
        break;
      }
    }
    if (value) {
      foundKeys.push(key);
      console.log(`✓ Found: admin:roadmap.${key} = "${value}"`);
    } else {
      missingKeys.push(key);
      console.log(`✗ Missing: admin:roadmap.${key}`);
    }
  } else {
    // Handle regular keys
    if (adminJson.roadmap[key]) {
      foundKeys.push(key);
      console.log(`✓ Found: admin:roadmap.${key} = "${adminJson.roadmap[key]}"`);
    } else {
      missingKeys.push(key);
      console.log(`✗ Missing: admin:roadmap.${key}`);
    }
  }
});

console.log('\n-----------------------------------');
console.log(`Summary: ${foundKeys.length}/${requiredKeys.length} keys found`);

if (missingKeys.length > 0) {
  console.log('\n❌ Missing keys:');
  missingKeys.forEach(key => console.log(`  - roadmap.${key}`));
} else {
  console.log('\n✅ All required translation keys are present!');
}

console.log('\n✅ i18n test complete!');