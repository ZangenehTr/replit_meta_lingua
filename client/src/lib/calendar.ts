export interface WeeklySchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SessionCalculation {
  totalSessions: number;
  calculatedEndDate: Date;
  sessionDates: Date[];
  weeklyHours: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

/**
 * Calculate session dates based on total hours, session duration, and weekly schedule
 */
export function calculateSessionDates(
  totalHours: number,
  sessionDurationMinutes: number,
  startDate: Date,
  weeklySchedule: WeeklySchedule[]
): SessionCalculation {
  const totalMinutes = totalHours * 60;
  const totalSessions = Math.ceil(totalMinutes / sessionDurationMinutes);
  const sessionDates: Date[] = [];
  
  // Sort weekly schedule by day of week
  const sortedSchedule = weeklySchedule
    .filter(schedule => schedule.day && schedule.startTime && schedule.endTime)
    .sort((a, b) => WEEKDAY_MAP[a.day] - WEEKDAY_MAP[b.day]);

  if (sortedSchedule.length === 0) {
    throw new Error("No valid weekly schedule provided");
  }

  // Calculate weekly hours
  const weeklyHours = sortedSchedule.reduce((total, schedule) => {
    const startTime = parseTime(schedule.startTime);
    const endTime = parseTime(schedule.endTime);
    return total + (endTime - startTime) / 60; // Convert minutes to hours
  }, 0);

  let sessionsScheduled = 0;
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Start from beginning of start date

  // Generate session dates by going through each week and finding matching days
  while (sessionsScheduled < totalSessions) {
    // Check each day of the current week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      if (sessionsScheduled >= totalSessions) break;
      
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = checkDate.getDay();
      
      // Find if this day has a scheduled session
      const scheduleForDay = sortedSchedule.find(schedule => 
        WEEKDAY_MAP[schedule.day] === dayOfWeek
      );
      
      if (scheduleForDay) {
        const sessionDate = new Date(checkDate);
        const [hours, minutes] = scheduleForDay.startTime.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);
        
        // Only add sessions that are on or after the start date
        if (sessionDate >= startDate) {
          sessionDates.push(new Date(sessionDate));
          sessionsScheduled++;
        }
      }
    }
    
    // Move to next week (Sunday of next week)
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // The last session date is our calculated end date
  const calculatedEndDate = sessionDates.length > 0 
    ? sessionDates[sessionDates.length - 1] 
    : startDate;

  return {
    totalSessions,
    calculatedEndDate,
    sessionDates,
    weeklyHours
  };
}

/**
 * Validate weekly schedule for conflicts and completeness
 */
export function validateWeeklySchedule(weeklySchedule: WeeklySchedule[]): string[] {
  const errors: string[] = [];

  for (let i = 0; i < weeklySchedule.length; i++) {
    const schedule = weeklySchedule[i];

    // Check required fields
    if (!schedule.day) {
      errors.push(`Session ${i + 1}: Day is required`);
    }
    if (!schedule.startTime) {
      errors.push(`Session ${i + 1}: Start time is required`);
    }
    if (!schedule.endTime) {
      errors.push(`Session ${i + 1}: End time is required`);
    }

    if (schedule.startTime && schedule.endTime) {
      const startMinutes = parseTime(schedule.startTime);
      const endMinutes = parseTime(schedule.endTime);

      // Check if end time is after start time
      if (endMinutes <= startMinutes) {
        errors.push(`Session ${i + 1}: End time must be after start time`);
      }

      // Check for conflicts with other sessions on the same day
      for (let j = i + 1; j < weeklySchedule.length; j++) {
        const otherSchedule = weeklySchedule[j];
        if (schedule.day === otherSchedule.day && otherSchedule.startTime && otherSchedule.endTime) {
          const otherStartMinutes = parseTime(otherSchedule.startTime);
          const otherEndMinutes = parseTime(otherSchedule.endTime);

          // Check for time overlap
          if (
            (startMinutes < otherEndMinutes && endMinutes > otherStartMinutes) ||
            (otherStartMinutes < endMinutes && otherEndMinutes > startMinutes)
          ) {
            errors.push(`Sessions ${i + 1} and ${j + 1}: Time conflict on ${schedule.day}`);
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Format date according to calendar type preference
 */
export function formatDateByCalendar(date: Date, calendarType: string = "gregorian"): string {
  if (calendarType === "persian") {
    // Basic Persian date formatting (would need proper Persian calendar library for production)
    return date.toLocaleDateString('fa-IR');
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate estimated course duration in weeks
 */
export function calculateCourseDurationWeeks(
  totalHours: number,
  weeklySchedule: WeeklySchedule[]
): number {
  if (weeklySchedule.length === 0) return 0;

  const weeklyHours = weeklySchedule.reduce((total, schedule) => {
    if (!schedule.startTime || !schedule.endTime) return total;
    const startMinutes = parseTime(schedule.startTime);
    const endMinutes = parseTime(schedule.endTime);
    return total + (endMinutes - startMinutes) / 60;
  }, 0);

  return weeklyHours > 0 ? Math.ceil(totalHours / weeklyHours) : 0;
}

/**
 * Generate time slots for a given duration and interval
 */
export function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 22,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
}