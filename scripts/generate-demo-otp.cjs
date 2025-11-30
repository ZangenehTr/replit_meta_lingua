#!/usr/bin/env node
/**
 * Generate Demo OTP Codes for Test Accounts
 * 
 * Usage: DEMO_TEST_SECRET=your_secret node scripts/generate-demo-otp.js [phone]
 * 
 * If no phone is provided, generates codes for all test accounts.
 */

const crypto = require('crypto');

const TEST_ACCOUNTS = [
  { phone: '+989121234567', role: 'Teacher', name: 'Sara Rezaei' },
  { phone: '+989127654321', role: 'Teacher', name: 'Ali Mohammadi' },
  { phone: '+989131234567', role: 'Student', name: 'Maryam Karimi' },
  { phone: '+989137654321', role: 'Student', name: 'Reza Ahmadi' },
  { phone: '+989101234567', role: 'Admin', name: 'Admin User' },
  { phone: '+989101234568', role: 'Accountant', name: 'Sara Accountant' },
  { phone: '+989101234569', role: 'Call Center', name: 'Ali CallCenter' },
  { phone: '+989101234570', role: 'Front Desk', name: 'Maryam FrontDesk' },
  { phone: '+989101234571', role: 'Mentor', name: 'Reza Mentor' },
];

function generateDemoCode(phone, secret) {
  const timeSlice = Math.floor(Date.now() / (30 * 60 * 1000));
  const data = `${phone}:${timeSlice}`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const hash = hmac.digest('hex');
  
  const code = (parseInt(hash.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
  return code;
}

const secret = process.env.DEMO_TEST_SECRET;
if (!secret) {
  console.error('Error: DEMO_TEST_SECRET environment variable is not set');
  console.error('Usage: DEMO_TEST_SECRET=your_secret node scripts/generate-demo-otp.js');
  process.exit(1);
}

const targetPhone = process.argv[2];
const now = new Date();
const timeSlice = Math.floor(now.getTime() / (30 * 60 * 1000));
const nextRotation = new Date((timeSlice + 1) * 30 * 60 * 1000);
const minutesRemaining = Math.ceil((nextRotation - now) / 60000);

console.log('\n========================================');
console.log('  Meta Lingua Demo OTP Codes');
console.log('========================================');
console.log(`Generated at: ${now.toISOString()}`);
console.log(`Valid for: ${minutesRemaining} more minutes`);
console.log(`Next rotation: ${nextRotation.toISOString()}`);
console.log('========================================\n');

if (targetPhone) {
  const account = TEST_ACCOUNTS.find(a => 
    a.phone === targetPhone || 
    a.phone.replace('+98', '0') === targetPhone
  );
  
  if (account) {
    const code = generateDemoCode(account.phone, secret);
    console.log(`Phone: ${account.phone}`);
    console.log(`Role: ${account.role}`);
    console.log(`Name: ${account.name}`);
    console.log(`OTP Code: ${code}`);
  } else {
    console.log(`Phone: ${targetPhone}`);
    const normalized = targetPhone.startsWith('+98') ? targetPhone : 
                       targetPhone.startsWith('0') ? '+98' + targetPhone.slice(1) : 
                       '+98' + targetPhone;
    const code = generateDemoCode(normalized, secret);
    console.log(`OTP Code: ${code}`);
  }
} else {
  console.log('Role           | Name              | Phone           | OTP Code');
  console.log('---------------|-------------------|-----------------|----------');
  
  TEST_ACCOUNTS.forEach(account => {
    const code = generateDemoCode(account.phone, secret);
    const role = account.role.padEnd(14);
    const name = account.name.padEnd(17);
    console.log(`${role} | ${name} | ${account.phone} | ${code}`);
  });
}

console.log('\n========================================');
console.log('How to use:');
console.log('1. Go to login page');
console.log('2. Enter phone number (e.g., 09121234567)');
console.log('3. Click "Send OTP"');
console.log('4. Enter the code from this table');
console.log('========================================\n');
