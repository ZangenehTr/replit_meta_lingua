/**
 * Persian Calendar Utilities
 * Provides local fallback functionality for Jalali calendar operations
 * when keybit.ir API is unavailable
 */

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian weekday names
const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

// Persian numerals for RTL display
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// Iranian holidays (basic set - can be expanded)
const IRANIAN_HOLIDAYS = [
  {
    name: 'نوروز',
    nameEnglish: 'Nowruz',
    month: 1,
    day: 1,
    duration: 4,
    type: 'national',
    description: 'Persian New Year - the most important celebration in Iranian culture'
  },
  {
    name: 'روز طبیعت',
    nameEnglish: 'Nature Day',
    month: 1,
    day: 13,
    duration: 1,
    type: 'national',
    description: 'Sizdah Bedar - Traditional picnic day, end of Nowruz celebrations'
  },
  {
    name: 'رحلت امام خمینی',
    nameEnglish: 'Imam Khomeini\'s Death Anniversary',
    month: 3,
    day: 14,
    duration: 1,
    type: 'religious',
    description: 'Death anniversary of Ayatollah Khomeini'
  },
  {
    name: 'قیام ۱۵ خرداد',
    nameEnglish: '15 Khordad Uprising',
    month: 3,
    day: 15,
    duration: 1,
    type: 'national',
    description: 'Anniversary of the 1963 uprising'
  },
  {
    name: 'انقلاب اسلامی',
    nameEnglish: 'Islamic Revolution Victory',
    month: 11,
    day: 22,
    duration: 2,
    type: 'national',
    description: 'Victory of the Islamic Revolution in 1979'
  }
];

/**
 * Check if a year is a leap year in the Persian calendar
 */
function isLeapYear(year: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];

  let gy = year + 1029;
  let leap = -14;
  let jp = breaks[0];

  // Find the limiting year for the Persian year
  let jump = 0;
  for (let j = 1; j < breaks.length; j++) {
    let jm = breaks[j];
    jump = jm - jp;
    if (year < jm) break;
    leap += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jm;
  }

  let n = year - jp;

  // Find the number of leap years from AD 621 to the beginning of the current Persian year
  if (n < jump) {
    leap += Math.floor(n / 33) * 8 + Math.floor((n % 33 + 3) / 4);
    if ((jump % 33) === 4 && (jump - n) === 4) leap++;
  }

  // Check if the current year is a leap year
  let leapAdj = 0;
  if ((jump - n) < 6) leapAdj = 1;

  return ((leap + leapAdj) % 1029) % 33 % 4 === 1;
}

/**
 * Get the number of days in a Persian month
 */
function getDaysInMonth(month: number, year: number): number {
  if (month <= 6) {
    return 31;
  } else if (month <= 11) {
    return 30;
  } else {
    return isLeapYear(year) ? 30 : 29;
  }
}

/**
 * Convert Gregorian date to Jalali
 */
function gregorianToJalali(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  let jy: number;
  if (gy <= 1600) {
    jy = 0;
  } else {
    jy = 979;
  }

  gy === 1600 ? (jy = 979) : (jy = 1029);
  
  let gy2 = gy > 1600 ? gy - 1600 : gy - 621;
  let days = 365 * gy2 + Math.floor((gy2 + 3) / 4) + Math.floor((gy2 + 99) / 100) - Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];

  if (gm > 2) {
    days += Math.floor(gy / 4) - Math.floor(gy / 100) + Math.floor(gy / 400) - Math.floor(1600 / 4) + Math.floor(1600 / 100) - Math.floor(1600 / 400);
  }

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days >= 366) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return {
    year: jy,
    month: jm,
    day: jd,
    weekday: date.getDay()
  };
}

/**
 * Convert Jalali date to Gregorian
 */
function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];

  let gy = jy + 1029;
  let leap = -14;
  let jp = breaks[0];

  // Find the limiting year for the Jalali year jy
  let jump = 0;
  for (let j = 1; j < breaks.length; j++) {
    let jm2 = breaks[j];
    jump = jm2 - jp;
    if (jy < jm2) break;
    leap += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jm2;
  }

  let n = jy - jp;

  if (n < jump) {
    leap += Math.floor(n / 33) * 8 + Math.floor((n % 33 + 3) / 4);
    if ((jump % 33) === 4 && (jump - n) === 4) leap++;
  }

  // Calculate the Gregorian date
  gy = jy <= 979 ? 1600 : 1621;
  let days = 365 * jy + Math.floor(leap / 1029) * 1029 + (leap % 1029) + jd;

  if (jm < 7) {
    days += (jm - 1) * 31;
  } else {
    days += (jm - 7) * 30 + 186;
  }

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;

    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days >= 366) {
    days--;
    gy += Math.floor(days / 365);
    days = days % 365;
  }

  const gd = days + 1;

  const sal_a = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0)) sal_a[2] = 29;

  let gm = 0;
  for (let i = 0; i < sal_a.length; i++) {
    let v = sal_a[i];
    if (gd <= v) {
      gm = i;
      break;
    }
  }

  return new Date(gy, gm - 1, gd - sal_a.slice(0, gm).reduce((a, b) => a + b, 0));
}

/**
 * Convert number to Persian digits
 */
function toPersianDigits(num: number | string): string {
  return num.toString().replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit)]);
}

/**
 * Format Persian date for display
 */
function formatPersianDate(
  year: number, 
  month: number, 
  day: number, 
  options: {
    usePersianDigits?: boolean;
    includeMonthName?: boolean;
    includeYear?: boolean;
    separator?: string;
  } = {}
): string {
  const {
    usePersianDigits = true,
    includeMonthName = false,
    includeYear = true,
    separator = '/'
  } = options;

  let formatted = '';

  if (includeYear) {
    formatted += usePersianDigits ? toPersianDigits(year) : year.toString();
    formatted += separator;
  }

  if (includeMonthName) {
    formatted += PERSIAN_MONTHS[month - 1];
  } else {
    formatted += usePersianDigits ? toPersianDigits(month) : month.toString();
  }

  formatted += separator;
  formatted += usePersianDigits ? toPersianDigits(day) : day.toString();

  return formatted;
}

/**
 * Get Iranian holidays for a specific year
 */
function getIranianHolidays(year: number): Array<{
  name: string;
  description: string;
  type: string;
  persianDate: string;
  gregorianDate: Date;
  isOfficial: boolean;
}> {
  return IRANIAN_HOLIDAYS.map(holiday => {
    const gregorianDate = jalaliToGregorian(year, holiday.month, holiday.day);
    return {
      name: holiday.name,
      description: holiday.description,
      type: holiday.type,
      persianDate: `${year}/${holiday.month}/${holiday.day}`,
      gregorianDate,
      isOfficial: holiday.type === 'national' || holiday.type === 'religious'
    };
  });
}

/**
 * Check if a date is a holiday
 */
function isHoliday(year: number, month: number, day: number): boolean {
  return IRANIAN_HOLIDAYS.some(holiday => 
    holiday.month === month && holiday.day === day
  );
}

/**
 * Get current Persian date
 */
function getCurrentPersianDate(): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  formatted: string;
} {
  const now = new Date();
  const jalali = gregorianToJalali(now);
  
  return {
    ...jalali,
    formatted: formatPersianDate(jalali.year, jalali.month, jalali.day)
  };
}

/**
 * Get days in Persian month
 */
function getDaysInPersianMonth(year: number, month: number): number {
  return getDaysInMonth(month, year);
}

/**
 * Generate calendar grid for a Persian month
 */
function generatePersianCalendarGrid(year: number, month: number): Array<Array<{
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  gregorianDate: Date;
}>> {
  const firstDay = jalaliToGregorian(year, month, 1);
  const startWeekday = (firstDay.getDay() + 1) % 7; // Adjust for Saturday start
  const daysInMonth = getDaysInPersianMonth(year, month);
  const today = getCurrentPersianDate();
  
  const grid: Array<Array<any>> = [];
  let week: Array<any> = [];
  
  // Add empty cells for days before the month starts
  for (let i = 0; i < startWeekday; i++) {
    week.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false,
      isHoliday: false,
      gregorianDate: new Date()
    });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const gregorianDate = jalaliToGregorian(year, month, day);
    const isToday = today.year === year && today.month === month && today.day === day;
    const isHolidayDay = isHoliday(year, month, day);
    
    week.push({
      day,
      isCurrentMonth: true,
      isToday,
      isHoliday: isHolidayDay,
      gregorianDate
    });
    
    // Start new week on Saturday
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  
  // Fill remaining cells
  while (week.length < 7) {
    week.push({
      day: 0,
      isCurrentMonth: false,
      isToday: false,
      isHoliday: false,
      gregorianDate: new Date()
    });
  }
  
  if (week.length > 0) {
    grid.push(week);
  }
  
  return grid;
}

// Export the Persian calendar utility functions
export const persianCalendar = {
  // Conversion functions
  gregorianToJalali,
  jalaliToGregorian,
  
  // Formatting functions
  toPersianDigits,
  formatPersianDate,
  
  // Calendar functions
  isLeapYear,
  getDaysInMonth: getDaysInPersianMonth,
  generateCalendarGrid: generatePersianCalendarGrid,
  getCurrentPersianDate,
  
  // Holiday functions
  getIranianHolidays,
  isHoliday,
  
  // Name getters
  getPersianMonthNames: () => [...PERSIAN_MONTHS],
  getPersianWeekdayNames: () => [...PERSIAN_WEEKDAYS],
  getPersianDigits: () => [...PERSIAN_DIGITS],
  
  // Constants
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  PERSIAN_DIGITS,
  IRANIAN_HOLIDAYS
};

export default persianCalendar;