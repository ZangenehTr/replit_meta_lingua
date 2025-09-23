/**
 * MetaLingua Course Code Generation System
 * Generates systematic course codes in format: CURRICULUM-LEVEL-TYPE-DAY-TIME
 */

export interface CourseCodeParams {
  curriculumKey: 'ielts' | 'conversation';
  levelCode: string; // F1, F2, PRO, A11, A12, etc.
  classFormat: 'group' | 'one_on_one' | 'online';
  weekdays: string[]; // ["monday", "wednesday", "friday"] or ["saturday"]
  startTime: string; // "10:00", "14:00", "19:00"
  deliveryMode: 'online' | 'in_person' | 'hybrid';
}

/**
 * Generate systematic course code
 * Examples:
 * - IELTS-F1-GRP-SAT-1000 (IELTS Flash 1, Group, Saturday 10:00)
 * - CONV-A12-IND-TUE-1400 (Conversation A1.2, Individual, Tuesday 14:00)
 * - IELTS-PRO-ONL-WED-1900 (IELTS Pro, Online, Wednesday 19:00)
 */
export function generateCourseCode(params: CourseCodeParams): string {
  const {
    curriculumKey,
    levelCode,
    classFormat,
    weekdays,
    startTime,
    deliveryMode
  } = params;

  // 1. Curriculum prefix
  const curriculumPrefix = curriculumKey === 'ielts' ? 'IELTS' : 'CONV';

  // 2. Level code (already formatted)
  const level = levelCode.toUpperCase();

  // 3. Type abbreviation
  let typeCode: string;
  if (deliveryMode === 'online') {
    typeCode = 'ONL'; // Online
  } else if (classFormat === 'one_on_one') {
    typeCode = 'IND'; // Individual
  } else {
    typeCode = 'GRP'; // Group
  }

  // 4. Day abbreviation (first weekday or combined for multiple days)
  const dayCode = generateDayCode(weekdays);

  // 5. Time code (remove colon from HH:MM format)
  const timeCode = startTime.replace(':', '');

  // Combine all parts
  return `${curriculumPrefix}-${level}-${typeCode}-${dayCode}-${timeCode}`;
}

/**
 * Generate day code from weekdays array
 */
function generateDayCode(weekdays: string[]): string {
  const dayMap: Record<string, string> = {
    'monday': 'MON',
    'tuesday': 'TUE',
    'wednesday': 'WED',
    'thursday': 'THU',
    'friday': 'FRI',
    'saturday': 'SAT',
    'sunday': 'SUN'
  };

  if (weekdays.length === 1) {
    // Single day: SAT, MON, etc.
    return dayMap[weekdays[0].toLowerCase()] || 'UNK';
  } else if (weekdays.length === 2) {
    // Two days: MOWE (Monday-Wednesday), THSA (Thursday-Saturday)
    const first = dayMap[weekdays[0].toLowerCase()]?.substring(0, 2) || 'UN';
    const second = dayMap[weekdays[1].toLowerCase()]?.substring(0, 2) || 'KN';
    return first + second;
  } else if (weekdays.length === 3) {
    // Three days: MWF (Monday-Wednesday-Friday)
    return weekdays
      .map(day => dayMap[day.toLowerCase()]?.[0] || 'U')
      .join('');
  } else {
    // Multiple days: use first letter of each day
    return weekdays
      .slice(0, 4) // Max 4 characters
      .map(day => dayMap[day.toLowerCase()]?.[0] || 'U')
      .join('');
  }
}

/**
 * Parse course code back to components
 * Useful for displaying course information from code
 */
export function parseCourseCode(courseCode: string): {
  curriculum: string;
  level: string;
  type: string;
  days: string;
  time: string;
} | null {
  const parts = courseCode.split('-');
  
  if (parts.length !== 5) {
    return null;
  }

  const [curriculum, level, type, days, time] = parts;

  return {
    curriculum: curriculum,
    level: level,
    type: type,
    days: days,
    time: time.substring(0, 2) + ':' + time.substring(2) // Convert back to HH:MM
  };
}

/**
 * Get human-readable description from course code
 */
export function getCourseCodeDescription(courseCode: string, language: 'en' | 'fa' = 'en'): string {
  const parsed = parseCourseCode(courseCode);
  
  if (!parsed) {
    return courseCode;
  }

  const { curriculum, level, type, days, time } = parsed;

  // Format descriptions
  const curriculumDesc = curriculum === 'IELTS' ? 'IELTS Preparation' : 'General Conversation';
  const typeDesc = type === 'ONL' ? 'Online' : type === 'IND' ? 'Individual' : 'Group';

  if (language === 'fa') {
    // Persian descriptions
    const curriculumDescFa = curriculum === 'IELTS' ? 'آمادگی آیلتس' : 'مکالمه عمومی';
    const typeDescFa = type === 'ONL' ? 'آنلاین' : type === 'IND' ? 'خصوصی' : 'گروهی';
    
    return `${curriculumDescFa} ${level} - ${typeDescFa} - ${days} ${time}`;
  }

  return `${curriculumDesc} ${level} - ${typeDesc} - ${days} ${time}`;
}

/**
 * Generate unique course code with sequence number if needed
 */
export function generateUniqueCourseCode(
  params: CourseCodeParams,
  existingCodes: string[]
): string {
  const baseCode = generateCourseCode(params);
  
  // Check if code already exists
  if (!existingCodes.includes(baseCode)) {
    return baseCode;
  }

  // Generate with sequence number
  let sequence = 1;
  let uniqueCode: string;
  
  do {
    const sequenceStr = sequence.toString().padStart(3, '0');
    uniqueCode = `${baseCode}-${sequenceStr}`;
    sequence++;
  } while (existingCodes.includes(uniqueCode) && sequence < 1000);

  return uniqueCode;
}

/**
 * Validate course code format
 */
export function isValidCourseCode(courseCode: string): boolean {
  const courseCodePattern = /^(IELTS|CONV)-[A-Z0-9]+-(ONL|IND|GRP)-[A-Z]{2,4}-\d{4}(-\d{3})?$/;
  return courseCodePattern.test(courseCode);
}

// Export types
// CourseCodeParams already exported as interface above