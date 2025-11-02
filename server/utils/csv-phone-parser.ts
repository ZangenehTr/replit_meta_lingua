import { parse } from 'csv-parse/sync';

interface PhoneRecord {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ParseResult {
  success: boolean;
  validPhones: PhoneRecord[];
  invalidPhones: string[];
  duplicates: string[];
  totalProcessed: number;
  error?: string;
}

/**
 * Normalize Iranian phone numbers to standard format (98XXXXXXXXXX)
 */
export function normalizeIranianPhone(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digits and common separators
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '').replace(/\D/g, '');
  
  // Handle different Iranian phone formats
  if (normalized.startsWith('0098')) {
    normalized = '98' + normalized.substring(4);
  } else if (normalized.startsWith('00')) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('+98')) {
    normalized = '98' + normalized.substring(3);
  } else if (normalized.startsWith('98') && normalized.length === 12) {
    // Already in correct format
  } else if (normalized.startsWith('09') && normalized.length === 11) {
    normalized = '98' + normalized.substring(1);
  } else if (normalized.startsWith('9') && normalized.length === 10) {
    normalized = '98' + normalized;
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = '98' + normalized.substring(1);
  } else {
    return null; // Invalid format
  }
  
  return normalized;
}

/**
 * Validate Iranian phone number format
 */
export function isValidIranianPhone(phone: string): boolean {
  if (!phone) return false;
  
  const normalized = normalizeIranianPhone(phone);
  if (!normalized) return false;
  
  // Must be 98XXXXXXXXXX (12 digits total)
  if (normalized.length !== 12) return false;
  
  // Must start with 98
  if (!normalized.startsWith('98')) return false;
  
  // Third digit should be 9 (mobile) or valid landline codes
  const thirdDigit = normalized.charAt(2);
  const validThirdDigits = ['9', '1', '2', '3', '4', '5', '6', '7', '8'];
  
  return validThirdDigits.includes(thirdDigit);
}

/**
 * Parse CSV/Excel content and extract validated phone numbers
 */
export function parsePhoneNumbersFromCSV(content: string): ParseResult {
  try {
    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
    });

    const validPhones: PhoneRecord[] = [];
    const invalidPhones: string[] = [];
    const seenPhones = new Set<string>();
    const duplicates: string[] = [];

    for (const record of records) {
      // Try to find phone number in various column names
      const phoneValue = 
        record.phone || 
        record.Phone || 
        record.mobile || 
        record.Mobile || 
        record.phoneNumber || 
        record.phone_number ||
        record.تلفن ||
        record.شماره ||
        record['شماره تلفن'] ||
        record['شماره همراه'] ||
        Object.values(record)[0]; // Fallback to first column

      if (!phoneValue) continue;

      const normalized = normalizeIranianPhone(phoneValue as string);

      if (normalized && isValidIranianPhone(normalized)) {
        // Check for duplicates
        if (seenPhones.has(normalized)) {
          duplicates.push(normalized);
          continue;
        }

        seenPhones.add(normalized);
        validPhones.push({
          phone: normalized,
          firstName: record.firstName || record.first_name || record.نام || '',
          lastName: record.lastName || record.last_name || record['نام خانوادگی'] || '',
          email: record.email || record.Email || record.ایمیل || ''
        });
      } else {
        invalidPhones.push(phoneValue as string);
      }
    }

    return {
      success: true,
      validPhones,
      invalidPhones,
      duplicates,
      totalProcessed: records.length
    };
  } catch (error) {
    return {
      success: false,
      validPhones: [],
      invalidPhones: [],
      duplicates: [],
      totalProcessed: 0,
      error: error instanceof Error ? error.message : 'Failed to parse CSV'
    };
  }
}

/**
 * Parse plain text list of phone numbers (one per line)
 */
export function parsePhoneNumbersFromText(text: string): ParseResult {
  try {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const validPhones: PhoneRecord[] = [];
    const invalidPhones: string[] = [];
    const seenPhones = new Set<string>();
    const duplicates: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to parse as "phone,name" or just "phone"
      const parts = trimmed.split(',').map(p => p.trim());
      const phoneValue = parts[0];

      const normalized = normalizeIranianPhone(phoneValue);

      if (normalized && isValidIranianPhone(normalized)) {
        // Check for duplicates
        if (seenPhones.has(normalized)) {
          duplicates.push(normalized);
          continue;
        }

        seenPhones.add(normalized);
        validPhones.push({
          phone: normalized,
          firstName: parts[1] || '',
          lastName: parts[2] || ''
        });
      } else {
        invalidPhones.push(phoneValue);
      }
    }

    return {
      success: true,
      validPhones,
      invalidPhones,
      duplicates,
      totalProcessed: lines.length
    };
  } catch (error) {
    return {
      success: false,
      validPhones: [],
      invalidPhones: [],
      duplicates: [],
      totalProcessed: 0,
      error: error instanceof Error ? error.message : 'Failed to parse text'
    };
  }
}

/**
 * Batch phone numbers into chunks for rate-limited sending
 */
export function batchPhoneNumbers(phones: PhoneRecord[], batchSize: number = 100): PhoneRecord[][] {
  const batches: PhoneRecord[][] = [];
  for (let i = 0; i < phones.length; i += batchSize) {
    batches.push(phones.slice(i, i + batchSize));
  }
  return batches;
}
