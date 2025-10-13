#!/usr/bin/env node

/**
 * Translation File Deduplication Script
 * 
 * This script removes duplicate keys from Persian (FA) translation files
 * that were manually edited without maintaining proper JSON structure.
 * 
 * Issues found:
 * - common.json: 114 duplicate keys
 * - admin.json: 240 duplicate keys  
 * - callcenter.json: 19 duplicate keys
 * 
 * The script preserves the LAST occurrence of each duplicate key
 * (matching JavaScript's native behavior when parsing JSON with duplicates)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Parse JSON file line by line and track duplicate keys
 */
function findDuplicates(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const keyOccurrences = new Map(); // key -> array of line numbers
  const keyPattern = /^\s*"([^"]+)":/;
  
  lines.forEach((line, index) => {
    const match = line.match(keyPattern);
    if (match) {
      const key = match[1];
      if (!keyOccurrences.has(key)) {
        keyOccurrences.set(key, []);
      }
      keyOccurrences.get(key).push(index + 1); // 1-indexed line numbers
    }
  });
  
  // Find duplicates
  const duplicates = new Map();
  keyOccurrences.forEach((lineNumbers, key) => {
    if (lineNumbers.length > 1) {
      duplicates.set(key, lineNumbers);
    }
  });
  
  return duplicates;
}

/**
 * Deduplicate JSON by parsing and re-stringifying
 * JavaScript naturally keeps the last occurrence of duplicate keys
 */
function deduplicateJSON(filePath) {
  log(`\n📝 Processing: ${filePath}`, 'cyan');
  
  // Find duplicates first
  const duplicates = findDuplicates(filePath);
  
  if (duplicates.size === 0) {
    log('  ✓ No duplicates found', 'green');
    return { duplicates: 0, processed: false };
  }
  
  log(`  ⚠️  Found ${duplicates.size} duplicate keys:`, 'yellow');
  
  // Show sample duplicates (first 5)
  let count = 0;
  duplicates.forEach((lineNumbers, key) => {
    if (count < 5) {
      log(`    - "${key}" appears ${lineNumbers.length} times (lines: ${lineNumbers.join(', ')})`, 'yellow');
      count++;
    }
  });
  
  if (duplicates.size > 5) {
    log(`    ... and ${duplicates.size - 5} more`, 'yellow');
  }
  
  // Read and parse JSON (JavaScript keeps last occurrence)
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(originalContent);
  
  // Create backup
  const backupPath = `${filePath}.backup`;
  fs.writeFileSync(backupPath, originalContent, 'utf8');
  log(`  💾 Backup created: ${backupPath}`, 'blue');
  
  // Write deduplicated JSON with proper formatting
  const cleanedContent = JSON.stringify(jsonData, null, 2) + '\n';
  fs.writeFileSync(filePath, cleanedContent, 'utf8');
  
  log(`  ✅ Deduplicated and saved`, 'green');
  
  return { duplicates: duplicates.size, processed: true };
}

/**
 * Main execution
 */
function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Persian Translation Deduplication Script', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const faDir = path.join(__dirname, '../client/src/i18n/locales/fa');
  
  const filesToProcess = [
    'common.json',
    'admin.json',
    'callcenter.json',
    'teacher.json',
    'student.json',
    'supervisor.json',
    'mentor.json',
    'accountant.json',
    'frontdesk.json',
    'auth.json',
    'callern.json',
    'coursePlayer.json',
    'courses.json'
  ];
  
  let totalDuplicates = 0;
  let filesProcessed = 0;
  
  filesToProcess.forEach(fileName => {
    const filePath = path.join(faDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      log(`\n⚠️  File not found: ${filePath}`, 'yellow');
      return;
    }
    
    const result = deduplicateJSON(filePath);
    totalDuplicates += result.duplicates;
    if (result.processed) {
      filesProcessed++;
    }
  });
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Summary:', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`  Files processed: ${filesProcessed}`, 'green');
  log(`  Total duplicates removed: ${totalDuplicates}`, 'green');
  log(`  Backups created: ${filesProcessed}`, 'blue');
  log('\n✅ Deduplication complete!', 'green');
  log('   All .backup files have been created for safety.\n', 'blue');
}

// Run the script
try {
  main();
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
}
