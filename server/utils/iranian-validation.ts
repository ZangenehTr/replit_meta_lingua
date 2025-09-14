/**
 * Iranian Business Validation Utilities
 * Comprehensive validation for Iranian contact information, addresses, and business data
 */

/**
 * Iranian Phone Number Validation
 * Supports all Iranian mobile and landline formats
 */
export interface IranianPhoneValidation {
  isValid: boolean;
  normalized: string;
  format: 'mobile' | 'landline' | 'invalid';
  carrier?: string;
  region?: string;
}

/**
 * Validate and normalize Iranian phone numbers
 * Supports formats: +98, 0098, 09xx, 02x-xxxx, etc.
 */
export function validateIranianPhone(phone: string): IranianPhoneValidation {
  if (!phone) {
    return { isValid: false, normalized: '', format: 'invalid' };
  }

  // Clean the phone number (remove spaces, dashes, parentheses)
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Mobile number patterns
  const mobilePatterns = [
    /^(\+98|0098|98)?9[0-9]{9}$/, // Standard mobile format
    /^09[0-9]{9}$/, // Local mobile format
  ];

  // Landline patterns for major Iranian cities
  const landlinePatterns = [
    /^(\+98|0098|98)?(21)[0-9]{8}$/, // Tehran
    /^(\+98|0098|98)?(31)[0-9]{8}$/, // Isfahan
    /^(\+98|0098|98)?(11)[0-9]{8}$/, // Gilan
    /^(\+98|0098|98)?(13)[0-9]{8}$/, // Mazandaran
    /^(\+98|0098|98)?(17)[0-9]{8}$/, // Golestan
    /^(\+98|0098|98)?(24)[0-9]{8}$/, // Zanjan
    /^(\+98|0098|98)?(25)[0-9]{8}$/, // Qom
    /^(\+98|0098|98)?(26)[0-9]{8}$/, // Alborz
    /^(\+98|0098|98)?(28)[0-9]{8}$/, // Qazvin
    /^(\+98|0098|98)?(34)[0-9]{8}$/, // Kerman
    /^(\+98|0098|98)?(35)[0-9]{8}$/, // Yazd
    /^(\+98|0098|98)?(38)[0-9]{8}$/, // Chaharmahal
    /^(\+98|0098|98)?(41)[0-9]{8}$/, // East Azerbaijan
    /^(\+98|0098|98)?(44)[0-9]{8}$/, // West Azerbaijan
    /^(\+98|0098|98)?(45)[0-9]{8}$/, // Ardabil
    /^(\+98|0098|98)?(51)[0-9]{8}$/, // Razavi Khorasan
    /^(\+98|0098|98)?(54)[0-9]{8}$/, // Sistan and Baluchestan
    /^(\+98|0098|98)?(56)[0-9]{8}$/, // South Khorasan
    /^(\+98|0098|98)?(58)[0-9]{8}$/, // North Khorasan
    /^(\+98|0098|98)?(61)[0-9]{8}$/, // Khuzestan
    /^(\+98|0098|98)?(66)[0-9]{8}$/, // Lorestan
    /^(\+98|0098|98)?(71)[0-9]{8}$/, // Fars
    /^(\+98|0098|98)?(74)[0-9]{8}$/, // Kohgiluyeh
    /^(\+98|0098|98)?(76)[0-9]{8}$/, // Hormozgan
    /^(\+98|0098|98)?(77)[0-9]{8}$/, // Bushehr
    /^(\+98|0098|98)?(81)[0-9]{8}$/, // Hamadan
    /^(\+98|0098|98)?(83)[0-9]{8}$/, // Kermanshah
    /^(\+98|0098|98)?(84)[0-9]{8}$/, // Ilam
    /^(\+98|0098|98)?(86)[0-9]{8}$/, // Markazi
    /^(\+98|0098|98)?(87)[0-9]{8}$/, // Kurdistan
  ];

  // Check mobile numbers
  for (const pattern of mobilePatterns) {
    if (pattern.test(cleaned)) {
      const normalized = normalizeIranianMobile(cleaned);
      const carrier = getMobileCarrier(normalized);
      return {
        isValid: true,
        normalized,
        format: 'mobile',
        carrier
      };
    }
  }

  // Check landline numbers
  for (const pattern of landlinePatterns) {
    if (pattern.test(cleaned)) {
      const normalized = normalizeIranianLandline(cleaned);
      const region = getLandlineRegion(normalized);
      return {
        isValid: true,
        normalized,
        format: 'landline',
        region
      };
    }
  }

  return { isValid: false, normalized: '', format: 'invalid' };
}

/**
 * Normalize Iranian mobile number to +98 format
 */
function normalizeIranianMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+98')) {
    return cleaned;
  } else if (cleaned.startsWith('0098')) {
    return '+98' + cleaned.substring(4);
  } else if (cleaned.startsWith('98')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('09')) {
    return '+98' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '+98' + cleaned;
  }
  
  return phone; // Return as-is if can't normalize
}

/**
 * Normalize Iranian landline number to +98 format
 */
function normalizeIranianLandline(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+98')) {
    return cleaned;
  } else if (cleaned.startsWith('0098')) {
    return '+98' + cleaned.substring(4);
  } else if (cleaned.startsWith('98')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+98' + cleaned.substring(1);
  }
  
  return phone; // Return as-is if can't normalize
}

/**
 * Get mobile carrier based on prefix
 */
function getMobileCarrier(phone: string): string {
  const number = phone.replace('+98', '');
  const prefix = number.substring(0, 3);
  
  const carriers: { [key: string]: string } = {
    '901': 'Irancell',
    '902': 'Irancell', 
    '903': 'Irancell',
    '905': 'Irancell',
    '930': 'Irancell',
    '933': 'Irancell',
    '934': 'Irancell',
    '935': 'Irancell',
    '936': 'Irancell',
    '937': 'Irancell',
    '938': 'Irancell',
    '939': 'Irancell',
    '910': 'Hamrah-e Avval',
    '911': 'Hamrah-e Avval',
    '912': 'Hamrah-e Avval',
    '913': 'Hamrah-e Avval',
    '914': 'Hamrah-e Avval',
    '915': 'Hamrah-e Avval',
    '916': 'Hamrah-e Avval',
    '917': 'Hamrah-e Avval',
    '918': 'Hamrah-e Avval',
    '919': 'Hamrah-e Avval',
    '990': 'Hamrah-e Avval',
    '991': 'Hamrah-e Avval',
    '992': 'Hamrah-e Avval',
    '993': 'Hamrah-e Avval',
    '994': 'Hamrah-e Avval',
    '995': 'Hamrah-e Avval',
    '996': 'Hamrah-e Avval',
    '997': 'Hamrah-e Avval',
    '998': 'Hamrah-e Avval',
    '999': 'Hamrah-e Avval',
    '920': 'Rightel',
    '921': 'Rightel',
    '922': 'MTCE',
    '934': 'TKC'
  };
  
  return carriers[prefix] || 'Unknown';
}

/**
 * Get landline region based on area code
 */
function getLandlineRegion(phone: string): string {
  const number = phone.replace('+98', '');
  const areaCode = number.substring(0, 2);
  
  const regions: { [key: string]: string } = {
    '21': 'Tehran',
    '31': 'Isfahan',
    '11': 'Gilan',
    '13': 'Mazandaran',
    '17': 'Golestan',
    '24': 'Zanjan',
    '25': 'Qom',
    '26': 'Alborz',
    '28': 'Qazvin',
    '34': 'Kerman',
    '35': 'Yazd',
    '38': 'Chaharmahal and Bakhtiari',
    '41': 'East Azerbaijan',
    '44': 'West Azerbaijan',
    '45': 'Ardabil',
    '51': 'Razavi Khorasan',
    '54': 'Sistan and Baluchestan',
    '56': 'South Khorasan',
    '58': 'North Khorasan',
    '61': 'Khuzestan',
    '66': 'Lorestan',
    '71': 'Fars',
    '74': 'Kohgiluyeh and Boyer-Ahmad',
    '76': 'Hormozgan',
    '77': 'Bushehr',
    '81': 'Hamadan',
    '83': 'Kermanshah',
    '84': 'Ilam',
    '86': 'Markazi',
    '87': 'Kurdistan'
  };
  
  return regions[areaCode] || 'Unknown';
}

/**
 * Iranian Email Validation
 * Validates email format and checks for common Iranian domains
 */
export function validateIranianEmail(email: string): { isValid: boolean; domain?: string; isIranianDomain?: boolean } {
  if (!email) {
    return { isValid: false };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false };
  }

  const domain = email.split('@')[1].toLowerCase();
  
  // Common Iranian email domains
  const iranianDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', // International but commonly used
    'chmail.ir', 'email.ir', 'iran.ir', 'co.ir',
    'ac.ir', 'gov.ir', 'org.ir', 'net.ir',
    'parsmail.com', 'persianmail.ir', 'iranmail.com'
  ];

  const isIranianDomain = iranianDomains.includes(domain) || domain.endsWith('.ir');

  return {
    isValid: true,
    domain,
    isIranianDomain
  };
}

/**
 * Iranian National ID (Melli Code) Validation
 */
export function validateIranianNationalId(nationalId: string): { isValid: boolean; formatted?: string } {
  if (!nationalId) {
    return { isValid: false };
  }

  // Remove any non-digit characters
  const cleaned = nationalId.replace(/\D/g, '');
  
  // Check length
  if (cleaned.length !== 10) {
    return { isValid: false };
  }

  // Check for invalid patterns (all same digits)
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return { isValid: false };
  }

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(cleaned[9]);

  let isValid = false;
  if (remainder < 2) {
    isValid = checkDigit === remainder;
  } else {
    isValid = checkDigit === 11 - remainder;
  }

  if (isValid) {
    // Format as XXX-XXXXXX-X
    const formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 9)}-${cleaned.substring(9)}`;
    return { isValid: true, formatted };
  }

  return { isValid: false };
}

/**
 * Iranian Address Validation
 */
export interface IranianAddressValidation {
  isValid: boolean;
  components?: {
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    postalCode?: string;
  };
}

/**
 * Validate Iranian postal codes
 */
export function validateIranianPostalCode(postalCode: string): { isValid: boolean; formatted?: string } {
  if (!postalCode) {
    return { isValid: false };
  }

  // Remove any non-digit characters
  const cleaned = postalCode.replace(/\D/g, '');
  
  // Iranian postal codes are 10 digits
  if (cleaned.length !== 10) {
    return { isValid: false };
  }

  // Format as XXXXX-XXXXX
  const formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  
  return { isValid: true, formatted };
}

/**
 * Persian text validation and normalization
 */
export function validatePersianText(text: string): { isValid: boolean; normalized?: string; hasArabic?: boolean } {
  if (!text) {
    return { isValid: false };
  }

  // Check if text contains Persian/Arabic characters
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const hasPersoArabic = persianRegex.test(text);

  // Normalize Persian text (convert Arabic characters to Persian equivalents)
  let normalized = text;
  
  // Common Arabic to Persian character mappings
  const arabicToPersian: { [key: string]: string } = {
    'ي': 'ی',  // Arabic ya to Persian ya
    'ك': 'ک',  // Arabic kaf to Persian kaf
    '٠': '۰',  // Arabic digit 0 to Persian
    '١': '۱',  // Arabic digit 1 to Persian
    '٢': '۲',  // Arabic digit 2 to Persian
    '٣': '۳',  // Arabic digit 3 to Persian
    '٤': '۴',  // Arabic digit 4 to Persian
    '٥': '۵',  // Arabic digit 5 to Persian
    '٦': '۶',  // Arabic digit 6 to Persian
    '٧': '۷',  // Arabic digit 7 to Persian
    '٨': '۸',  // Arabic digit 8 to Persian
    '٩': '۹'   // Arabic digit 9 to Persian
  };

  for (const [arabic, persian] of Object.entries(arabicToPersian)) {
    normalized = normalized.replace(new RegExp(arabic, 'g'), persian);
  }

  return {
    isValid: true,
    normalized,
    hasArabic: hasPersoArabic
  };
}

/**
 * Iranian business hours validation
 */
export function validateIranianBusinessHours(time: string): { isValid: boolean; formatted?: string } {
  if (!time) {
    return { isValid: false };
  }

  // Parse time in various formats (HH:MM, H:MM, HH.MM, etc.)
  const timeRegex = /^(\d{1,2})[:.]\d{2}$/;
  if (!timeRegex.test(time)) {
    return { isValid: false };
  }

  const [hours, minutes] = time.split(/[:.]/);
  const hour = parseInt(hours);
  const minute = parseInt(minutes);

  // Validate hour and minute ranges
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { isValid: false };
  }

  // Format consistently as HH:MM
  const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  return { isValid: true, formatted };
}

/**
 * Iranian currency (IRR) validation and formatting
 */
export function validateIranianCurrency(amount: string | number): { isValid: boolean; formatted?: string; numericValue?: number } {
  if (!amount && amount !== 0) {
    return { isValid: false };
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[,\s]/g, '')) : amount;

  if (isNaN(numericAmount) || numericAmount < 0) {
    return { isValid: false };
  }

  // Format with Persian number separators (thousands)
  const formatted = new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0
  }).format(numericAmount);

  return {
    isValid: true,
    formatted,
    numericValue: numericAmount
  };
}