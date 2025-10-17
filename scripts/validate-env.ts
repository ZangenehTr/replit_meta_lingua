#!/usr/bin/env tsx
/**
 * Environment Configuration Validation Script
 * 
 * Usage:
 *   npm run validate:env
 *   
 * This script validates all required environment variables before deployment.
 * Returns exit code 0 if valid, 1 if invalid.
 */

import { validateEnvironment } from '../server/config/env-validator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

console.log('');
console.log('==================================================');
console.log('  MetaLingua Environment Validation');
console.log('==================================================');
console.log('');

const result = validateEnvironment();

console.log('');

if (result.success) {
  console.log('✅ SUCCESS: Environment configuration is valid');
  console.log('');
  console.log('Your application is ready to deploy with current configuration.');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Environment configuration has errors');
  console.log('');
  console.log('Please fix the above errors before deploying.');
  console.log('See .env.production.template for reference.');
  console.log('');
  process.exit(1);
}
