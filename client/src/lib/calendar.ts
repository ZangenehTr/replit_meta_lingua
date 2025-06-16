// Calendar utilities for course scheduling
import { format, addDays, addWeeks, isSaturday, isSunday, isMonday, isTuesday, isWednesday, isThursday, isFriday } from 'date-fns';

export interface WeeklySchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SessionCalculation {
  totalSessions: number;
  calculatedEndDate: Date;
  sessionDates: Array<{
    sessionNumber: number;
    date: Date;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
  }>;
}

// Persian calendar utilities
export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const WEEKDAYS = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  fa: ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه', 'یکشنبه']
};

export function getDayOfWeekNumber(dayName: string): number {
  const dayMap: { [key: string]: number } = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0
  };
  return dayMap[dayName.toLowerCase()] || 0;
}

export function isDayOfWeek(date: Date, dayName: string): boolean {
  const dayCheckers: { [key: string]: (date: Date) => boolean } = {
    'monday': isMonday,
    'tuesday': isTuesday,
    'wednesday': isWednesday,
    'thursday': isThursday,
    'friday': isFriday,
    'saturday': isSaturday,
    'sunday': isSunday
  };
  return dayCheckers[dayName.toLowerCase()]?.(date) || false;
}

export function calculateSessionDates(
  totalHours: number,
  sessionDurationMinutes: number,
  firstSessionDate: Date,
  weeklySchedule: WeeklySchedule[]
): SessionCalculation {
  const totalMinutes = totalHours * 60;
  const totalSessions = Math.ceil(totalMinutes / sessionDurationMinutes);
  
  const sessionDates: SessionCalculation['sessionDates'] = [];
  let currentDate = new Date(firstSessionDate);
  let sessionCount = 0;
  let maxIterations = 365 * 2; // Prevent infinite loops
  
  while (sessionCount < totalSessions && maxIterations > 0) {
    // Check if current date matches any of the weekly schedule days
    for (const schedule of weeklySchedule) {
      if (isDayOfWeek(currentDate, schedule.day)) {
        sessionCount++;
        sessionDates.push({
          sessionNumber: sessionCount,
          date: new Date(currentDate),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          dayOfWeek: schedule.day
        });
        
        if (sessionCount >= totalSessions) break;
      }
    }
    
    currentDate = addDays(currentDate, 1);
    maxIterations--;
  }
  
  const calculatedEndDate = sessionDates.length > 0 
    ? sessionDates[sessionDates.length - 1].date 
    : new Date(firstSessionDate);
  
  return {
    totalSessions,
    calculatedEndDate,
    sessionDates
  };
}

export function calculateSessionDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}

export function validateWeeklySchedule(schedule: WeeklySchedule[]): string[] {
  const errors: string[] = [];
  
  if (schedule.length === 0) {
    errors.push('At least one weekly session is required');
    return errors;
  }
  
  for (const session of schedule) {
    if (!session.day) {
      errors.push('Day of week is required for all sessions');
    }
    
    if (!session.startTime || !session.endTime) {
      errors.push('Start and end times are required for all sessions');
    }
    
    if (session.startTime && session.endTime) {
      const duration = calculateSessionDuration(session.startTime, session.endTime);
      if (duration <= 0) {
        errors.push(`Invalid time range for ${session.day}: end time must be after start time`);
      }
      if (duration < 30) {
        errors.push(`Session duration too short for ${session.day}: minimum 30 minutes required`);
      }
    }
  }
  
  return errors;
}

// Persian calendar conversion (simplified)
export function toPersianDate(date: Date): string {
  // This is a simplified implementation
  // In a real app, you'd use a library like moment-jalaali
  const persianYear = date.getFullYear() - 621;
  const persianMonth = Math.min(date.getMonth() + 1, 12);
  const persianDay = date.getDate();
  
  return `${persianYear}/${persianMonth.toString().padStart(2, '0')}/${persianDay.toString().padStart(2, '0')}`;
}

export function formatDateByCalendar(date: Date, calendarType: 'gregorian' | 'persian' = 'gregorian'): string {
  if (calendarType === 'persian') {
    return toPersianDate(date);
  }
  return format(date, 'yyyy-MM-dd');
}