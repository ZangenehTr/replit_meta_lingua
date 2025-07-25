// Persian/Farsi number formatting utilities

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert English numerals to Persian numerals
 */
export function toPersianNumbers(str: string | number): string {
  const stringValue = str.toString();
  return stringValue.replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Convert Persian numerals to English numerals
 */
export function toEnglishNumbers(str: string): string {
  return str.replace(/[۰-۹]/g, (digit) => {
    const index = persianDigits.indexOf(digit);
    return englishDigits[index];
  });
}

/**
 * Format number with Persian digits and proper separators
 */
export function formatPersianNumber(num: number | string, options: {
  useThousandSeparator?: boolean;
  decimalPlaces?: number;
} = {}): string {
  const { useThousandSeparator = true, decimalPlaces } = options;
  
  let numStr = typeof num === 'string' ? num : num.toString();
  
  // Handle decimal places
  if (decimalPlaces !== undefined) {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    numStr = numValue.toFixed(decimalPlaces);
  }
  
  // Add thousand separators
  if (useThousandSeparator) {
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '،');
    numStr = parts.join('.');
  }
  
  // Convert to Persian digits
  return toPersianNumbers(numStr);
}

/**
 * Format currency with Persian digits and IRR symbol
 */
export function formatPersianCurrency(amount: number | string): string {
  const formatted = formatPersianNumber(amount, { useThousandSeparator: true });
  return `${formatted} ریال`;
}

/**
 * Format percentage with Persian digits
 */
export function formatPersianPercentage(value: number | string): string {
  return `${toPersianNumbers(value.toString())}٪`;
}

/**
 * Check if current language is RTL (Persian or Arabic)
 */
export function isRTL(language: string): boolean {
  return ['fa', 'ar'].includes(language);
}

/**
 * Format mixed English/Persian text with proper Persian translations
 */
export function formatPersianText(text: string): string {
  return text
    .replace(/full\s+(\d+\.?\d*%?)/gi, (match, number) => {
      const persianNumber = toPersianNumbers(number.replace('%', ''));
      return `کامل ${persianNumber}${number.includes('%') ? '٪' : ''}`;
    })
    .replace(/used\s+(\d+\.?\d*%?)/gi, (match, number) => {
      const persianNumber = toPersianNumbers(number.replace('%', ''));
      return `استفاده شده ${persianNumber}${number.includes('%') ? '٪' : ''}`;
    });
}