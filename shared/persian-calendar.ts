/**
 * Persian Calendar Utilities (Shared)
 * Provides accurate Jalali calendar operations using jalaali-js library
 * when keybit.ir API is unavailable
 */

import * as jalaali from 'jalaali-js';

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
 * Check if a year is a leap year in the Persian calendar using jalaali-js
 */
function isLeapYear(year: number): boolean {
  return jalaali.isLeapJalaaliYear(year);
}

/**
 * Get the number of days in a Persian month using jalaali-js
 */
function getDaysInMonth(month: number, year: number): number {
  return jalaali.jalaaliMonthLength(year, month);
}

/**
 * Convert Gregorian date to Jalali using jalaali-js
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

  const converted = jalaali.toJalaali(gy, gm, gd);

  return {
    year: converted.jy,
    month: converted.jm,
    day: converted.jd,
    weekday: date.getDay()
  };
}

/**
 * Convert Jalali date to Gregorian using jalaali-js
 */
function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const converted = jalaali.toGregorian(jy, jm, jd);
  return new Date(converted.gy, converted.gm - 1, converted.gd);
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

// Export the Persian calendar utility functions
export const persianCalendar = {
  // Conversion functions
  gregorianToJalali,
  jalaliToGregorian,
  
  // Calendar functions
  isLeapYear,
  getDaysInMonth,
  
  // Holiday functions
  getIranianHolidays,
  
  // Name getters
  getPersianMonthNames: () => [...PERSIAN_MONTHS],
  getPersianWeekdayNames: () => [...PERSIAN_WEEKDAYS],
  
  // Constants
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  PERSIAN_DIGITS,
  IRANIAN_HOLIDAYS
};

export default persianCalendar;