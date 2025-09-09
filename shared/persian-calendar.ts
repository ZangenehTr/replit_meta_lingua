// Persian Calendar (Solar Hijri) Utilities for Iranian Language Institute
// Accurate conversion between Gregorian and Persian calendars with Iranian holidays

export interface PersianDate {
  year: number;
  month: number;
  day: number;
  weekDay: number; // 0 = شنبه (Saturday), 6 = جمعه (Friday)
  dayOfYear: number;
  weekOfYear: number;
  isLeapYear: boolean;
}

export interface PersianHoliday {
  id: string;
  name: string;
  nameFarsi: string;
  type: 'national' | 'religious' | 'cultural';
  isOfficial: boolean; // Official government holiday
  isVariable: boolean; // Changes each year (lunar-based)
  month?: number; // Fixed month (1-12)
  day?: number; // Fixed day (1-31)
  description?: string;
  descriptionFarsi?: string;
}

// Persian month names
export const PERSIAN_MONTHS = [
  { index: 1, name: 'Farvardin', nameFarsi: 'فروردین', days: 31 },
  { index: 2, name: 'Ordibehesht', nameFarsi: 'اردیبهشت', days: 31 },
  { index: 3, name: 'Khordad', nameFarsi: 'خرداد', days: 31 },
  { index: 4, name: 'Tir', nameFarsi: 'تیر', days: 31 },
  { index: 5, name: 'Mordad', nameFarsi: 'مرداد', days: 31 },
  { index: 6, name: 'Shahrivar', nameFarsi: 'شهریور', days: 31 },
  { index: 7, name: 'Mehr', nameFarsi: 'مهر', days: 30 },
  { index: 8, name: 'Aban', nameFarsi: 'آبان', days: 30 },
  { index: 9, name: 'Azar', nameFarsi: 'آذر', days: 30 },
  { index: 10, name: 'Dey', nameFarsi: 'دی', days: 30 },
  { index: 11, name: 'Bahman', nameFarsi: 'بهمن', days: 30 },
  { index: 12, name: 'Esfand', nameFarsi: 'اسفند', days: 29 } // 30 in leap years
];

// Persian weekday names (Saturday = 0)
export const PERSIAN_WEEKDAYS = [
  { index: 0, name: 'Shanbeh', nameFarsi: 'شنبه', shortFarsi: 'ش' },
  { index: 1, name: 'Yekshanbeh', nameFarsi: 'یکشنبه', shortFarsi: 'ی' },
  { index: 2, name: 'Doshanbeh', nameFarsi: 'دوشنبه', shortFarsi: 'د' },
  { index: 3, name: 'Seshhanbeh', nameFarsi: 'سه‌شنبه', shortFarsi: 'س' },
  { index: 4, name: 'Chaharshanbeh', nameFarsi: 'چهارشنبه', shortFarsi: 'چ' },
  { index: 5, name: 'Panjshanbeh', nameFarsi: 'پنج‌شنبه', shortFarsi: 'پ' },
  { index: 6, name: 'Jomeh', nameFarsi: 'جمعه', shortFarsi: 'ج' }
];

// Persian numbers for display
export const PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// Convert English numbers to Persian/Farsi numbers
export function toPersianNumbers(num: string | number): string {
  const str = num.toString();
  return str.replace(/[0-9]/g, (digit) => PERSIAN_NUMBERS[parseInt(digit)]);
}

// Convert Persian numbers to English numbers
export function toEnglishNumbers(persianNum: string): string {
  return persianNum.replace(/[۰-۹]/g, (digit) => PERSIAN_NUMBERS.indexOf(digit).toString());
}

// Check if a Persian year is leap year
export function isPersianLeapYear(year: number): boolean {
  // Persian leap year algorithm (33-year cycle)
  const cycle = year % 128;
  if (cycle <= 29) return [1, 5, 9, 13, 17, 22, 26, 30].includes(cycle);
  if (cycle <= 62) return [34, 38, 42, 46, 50, 55, 59].includes(cycle);
  if (cycle <= 95) return [63, 67, 71, 75, 79, 84, 88, 92].includes(cycle);
  return [96, 100, 104, 108, 112, 117, 121, 125].includes(cycle);
}

// Get number of days in a Persian month
export function getPersianMonthDays(month: number, year: number): number {
  if (month === 12) {
    return isPersianLeapYear(year) ? 30 : 29;
  }
  return PERSIAN_MONTHS[month - 1].days;
}

// Convert Gregorian date to Persian date
export function gregorianToPersian(date: Date): PersianDate {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  // Calculate Julian day number
  const a = Math.floor((14 - gregorianMonth) / 12);
  const y = gregorianYear - a;
  const m = gregorianMonth + 12 * a - 3;
  
  const jd = gregorianDay + Math.floor((153 * m + 2) / 5) + 365 * y + 
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
  
  // Convert Julian day to Persian date
  const persianEpoch = 1948321; // Julian day of Persian epoch (March 22, 622 CE)
  const persianDays = jd - persianEpoch;
  
  // Calculate Persian year
  const cycle = Math.floor(persianDays / 128);
  const yearInCycle = Math.floor((persianDays % 128) / 365.2422);
  const persianYear = 1 + cycle * 128 + yearInCycle;
  
  // Calculate day of year
  const yearStart = persianToJulian(persianYear, 1, 1);
  const dayOfYear = jd - yearStart + 1;
  
  // Calculate month and day
  let persianMonth = 1;
  let remainingDays = dayOfYear;
  
  for (let month = 1; month <= 12; month++) {
    const monthDays = getPersianMonthDays(month, persianYear);
    if (remainingDays <= monthDays) {
      persianMonth = month;
      break;
    }
    remainingDays -= monthDays;
    persianMonth = month + 1;
  }
  
  const persianDay = remainingDays;
  
  // Calculate week day (Saturday = 0)
  const weekDay = (jd + 2) % 7; // Adjust for Saturday = 0
  
  // Calculate week of year
  const firstDayOfYear = persianToJulian(persianYear, 1, 1);
  const firstWeekDay = (firstDayOfYear + 2) % 7;
  const weekOfYear = Math.ceil((dayOfYear + firstWeekDay) / 7);
  
  return {
    year: persianYear,
    month: persianMonth,
    day: persianDay,
    weekDay: weekDay,
    dayOfYear: dayOfYear,
    weekOfYear: weekOfYear,
    isLeapYear: isPersianLeapYear(persianYear)
  };
}

// Convert Persian date to Julian day number
function persianToJulian(year: number, month: number, day: number): number {
  const persianEpoch = 1948321;
  const cycle = Math.floor((year - 1) / 128);
  const yearInCycle = (year - 1) % 128;
  
  let daysSinceCycleStart = 0;
  for (let y = 1; y <= yearInCycle; y++) {
    daysSinceCycleStart += isPersianLeapYear(y) ? 366 : 365;
  }
  
  for (let m = 1; m < month; m++) {
    daysSinceCycleStart += getPersianMonthDays(m, year);
  }
  
  daysSinceCycleStart += day - 1;
  
  return persianEpoch + cycle * 46751 + daysSinceCycleStart; // 46751 days in 128-year cycle
}

// Convert Persian date to Gregorian date
export function persianToGregorian(persianYear: number, persianMonth: number, persianDay: number): Date {
  const jd = persianToJulian(persianYear, persianMonth, persianDay);
  
  // Convert Julian day to Gregorian date
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  
  const gregorianDay = e - Math.floor((153 * m + 2) / 5) + 1;
  const gregorianMonth = m + 3 - 12 * Math.floor(m / 10);
  const gregorianYear = 100 * b + d - 4800 + Math.floor(m / 10);
  
  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
}

// Format Persian date as string
export function formatPersianDate(
  persianDate: PersianDate, 
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  usePersianNumbers: boolean = true
): string {
  const monthName = PERSIAN_MONTHS[persianDate.month - 1];
  const weekDayName = PERSIAN_WEEKDAYS[persianDate.weekDay];
  
  let formatted = '';
  
  switch (format) {
    case 'short':
      formatted = `${persianDate.year}/${persianDate.month.toString().padStart(2, '0')}/${persianDate.day.toString().padStart(2, '0')}`;
      break;
    case 'medium':
      formatted = `${persianDate.day} ${monthName.nameFarsi} ${persianDate.year}`;
      break;
    case 'long':
      formatted = `${weekDayName.nameFarsi}، ${persianDate.day} ${monthName.nameFarsi} ${persianDate.year}`;
      break;
    case 'full':
      formatted = `${weekDayName.nameFarsi}، ${persianDate.day} ${monthName.nameFarsi} سال ${persianDate.year}`;
      break;
  }
  
  return usePersianNumbers ? toPersianNumbers(formatted) : formatted;
}

// Get current Persian date
export function getCurrentPersianDate(): PersianDate {
  return gregorianToPersian(new Date());
}

// Add/subtract days to Persian date
export function addDaysToPersianDate(persianDate: PersianDate, days: number): PersianDate {
  const gregorianDate = persianToGregorian(persianDate.year, persianDate.month, persianDate.day);
  gregorianDate.setDate(gregorianDate.getDate() + days);
  return gregorianToPersian(gregorianDate);
}

// Calculate difference between two Persian dates
export function persianDateDiff(date1: PersianDate, date2: PersianDate): number {
  const greg1 = persianToGregorian(date1.year, date1.month, date1.day);
  const greg2 = persianToGregorian(date2.year, date2.month, date2.day);
  return Math.floor((greg2.getTime() - greg1.getTime()) / (1000 * 60 * 60 * 24));
}

// Check if two Persian dates are the same
export function isSamePersianDate(date1: PersianDate, date2: PersianDate): boolean {
  return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
}

// Get Persian date range (useful for calendar views)
export function getPersianDateRange(startDate: PersianDate, endDate: PersianDate): PersianDate[] {
  const dates: PersianDate[] = [];
  let currentDate = { ...startDate };
  
  while (!isSamePersianDate(currentDate, endDate)) {
    dates.push({ ...currentDate });
    currentDate = addDaysToPersianDate(currentDate, 1);
  }
  dates.push({ ...endDate });
  
  return dates;
}