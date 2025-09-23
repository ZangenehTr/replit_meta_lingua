import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { persianCalendar } from '@/lib/persian-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Globe,
  Sun,
  Moon,
  Star
} from 'lucide-react';

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  gregorianDate: Date;
  persianDate?: {
    year: number;
    month: number;
    day: number;
  };
  events?: CalendarEvent[];
}

interface CalendarEvent {
  id: number;
  eventName: string;
  eventNamePersian: string;
  eventType: string;
  description: string;
  importance: string;
  color: string;
  isPublicHoliday: boolean;
}

interface Holiday {
  name: string;
  description: string;
  type: string;
  persianDate: string;
  gregorianDate: Date;
  isOfficial: boolean;
}

interface PersianCalendarProps {
  /** Calendar mode: auto switches based on user language, manual allows user selection */
  mode?: 'auto' | 'manual';
  /** Initial calendar type */
  initialType?: 'gregorian' | 'jalali';
  /** Show holidays */
  showHolidays?: boolean;
  /** Show cultural events */
  showEvents?: boolean;
  /** Allow type switching */
  allowTypeSwitch?: boolean;
  /** Compact view */
  compact?: boolean;
  /** Date selection callback */
  onDateSelect?: (date: Date, persianDate?: { year: number; month: number; day: number }) => void;
  /** Selected date */
  selectedDate?: Date;
  /** Additional CSS classes */
  className?: string;
}

export function PersianCalendar({
  mode = 'auto',
  initialType = 'gregorian',
  showHolidays = true,
  showEvents = true,
  allowTypeSwitch = true,
  compact = false,
  onDateSelect,
  selectedDate,
  className
}: PersianCalendarProps) {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const direction = i18n.dir();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarType, setCalendarType] = useState<'gregorian' | 'jalali'>(() => {
    // Auto-switch based on language if mode is auto
    if (mode === 'auto') {
      return (language === 'fa' || language === 'ar') ? 'jalali' : 'gregorian';
    }
    return initialType;
  });

  // Auto-switch calendar type based on language
  useEffect(() => {
    if (mode === 'auto') {
      const newType = (language === 'fa' || language === 'ar') ? 'jalali' : 'gregorian';
      if (newType !== calendarType) {
        setCalendarType(newType);
      }
    }
  }, [language, mode, calendarType]);

  // Get current Persian date
  const currentPersianDate = useMemo(() => {
    return persianCalendar.gregorianToJalali(currentDate);
  }, [currentDate]);

  // Get month and weekday names
  const { data: calendarNames } = useQuery({
    queryKey: ['/api/calendar/month-names'],
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    enabled: calendarType === 'jalali'
  });

  // Get holidays for current year
  const { data: holidaysData } = useQuery({
    queryKey: ['/api/calendar/holidays', currentPersianDate.year],
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    enabled: showHolidays && calendarType === 'jalali'
  });

  // Month and weekday names
  const monthNames = useMemo(() => {
    if (calendarType === 'jalali') {
      return calendarNames?.months || persianCalendar.getPersianMonthNames();
    } else {
      const gregorianMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return gregorianMonths;
    }
  }, [calendarType, calendarNames]);

  const weekdayNames = useMemo(() => {
    if (calendarType === 'jalali') {
      return calendarNames?.weekdays || persianCalendar.getPersianWeekdayNames();
    } else {
      const gregorianWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return gregorianWeekdays;
    }
  }, [calendarType, calendarNames]);

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    if (calendarType === 'jalali') {
      return persianCalendar.generateCalendarGrid(currentPersianDate.year, currentPersianDate.month);
    } else {
      // Generate Gregorian calendar grid
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startWeekday = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      const today = new Date();
      
      const grid: CalendarDay[][] = [];
      let week: CalendarDay[] = [];
      
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
        const date = new Date(year, month, day);
        const isToday = 
          today.getFullYear() === year && 
          today.getMonth() === month && 
          today.getDate() === day;
        
        week.push({
          day,
          isCurrentMonth: true,
          isToday,
          isHoliday: date.getDay() === 5, // Friday
          gregorianDate: date,
          persianDate: persianCalendar.gregorianToJalali(date)
        });
        
        // Start new week on Sunday
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
  }, [calendarType, currentDate, currentPersianDate]);

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (calendarType === 'jalali') {
      const newMonth = direction === 'next' 
        ? currentPersianDate.month + 1 
        : currentPersianDate.month - 1;
      let newYear = currentPersianDate.year;
      
      if (newMonth > 12) {
        newYear++;
        const newDate = persianCalendar.jalaliToGregorian(newYear, 1, 1);
        setCurrentDate(newDate);
      } else if (newMonth < 1) {
        newYear--;
        const newDate = persianCalendar.jalaliToGregorian(newYear, 12, 1);
        setCurrentDate(newDate);
      } else {
        const newDate = persianCalendar.jalaliToGregorian(newYear, newMonth, 1);
        setCurrentDate(newDate);
      }
    } else {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        if (direction === 'next') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else {
          newDate.setMonth(newDate.getMonth() - 1);
        }
        return newDate;
      });
    }
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth || !onDateSelect) return;
    
    onDateSelect(day.gregorianDate, day.persianDate);
  };

  const formatDisplayDate = () => {
    if (calendarType === 'jalali') {
      const monthName = monthNames[currentPersianDate.month - 1];
      const year = language === 'fa' 
        ? persianCalendar.toPersianDigits(currentPersianDate.year)
        : currentPersianDate.year;
      return `${monthName} ${year}`;
    } else {
      const monthName = monthNames[currentDate.getMonth()];
      return `${monthName} ${currentDate.getFullYear()}`;
    }
  };

  // Check if a date is a holiday
  const isHolidayDate = (day: CalendarDay): boolean => {
    if (!showHolidays || !holidaysData?.holidays) return false;
    
    if (calendarType === 'jalali' && day.persianDate) {
      return holidaysData.holidays.some((holiday: Holiday) => {
        const holidayParts = holiday.persianDate.split('/');
        return (
          parseInt(holidayParts[1]) === day.persianDate!.month &&
          parseInt(holidayParts[2]) === day.persianDate!.day
        );
      });
    }
    
    return day.isHoliday;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'national':
        return <Star className="h-3 w-3" />;
      case 'religious':
        return <Moon className="h-3 w-3" />;
      case 'cultural':
        return <Sun className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  return (
    <Card className={cn("w-full", className)} data-testid="persian-calendar">
      <CardHeader className={cn("space-y-4", compact && "pb-2")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {formatDisplayDate()}
          </CardTitle>
          
          {allowTypeSwitch && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select
                value={calendarType}
                onValueChange={(value: 'gregorian' | 'jalali') => setCalendarType(value)}
              >
                <SelectTrigger className="w-32" data-testid="calendar-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gregorian">Gregorian</SelectItem>
                  <SelectItem value="jalali">Jalali</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('prev')}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-lg font-semibold">
            {formatDisplayDate()}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('next')}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4">
          {/* Weekday headers */}
          <div className={cn(
            "grid grid-cols-7 gap-1 mb-2",
            direction === 'rtl' && calendarType === 'jalali' && "grid-flow-col-dense"
          )}>
            {weekdayNames.map((weekday, index) => (
              <div
                key={index}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="space-y-1">
            {calendarGrid.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className={cn(
                  "grid grid-cols-7 gap-1",
                  direction === 'rtl' && calendarType === 'jalali' && "grid-flow-col-dense"
                )}
              >
                {week.map((day, dayIndex) => {
                  const isSelected = selectedDate && 
                    day.gregorianDate.toDateString() === selectedDate.toDateString();
                  const isHoliday = isHolidayDate(day);
                  
                  return (
                    <Button
                      key={dayIndex}
                      variant={isSelected ? "default" : day.isToday ? "secondary" : "ghost"}
                      className={cn(
                        "h-12 w-12 p-0 text-sm relative",
                        !day.isCurrentMonth && "text-muted-foreground opacity-50",
                        isHoliday && "text-red-600 font-semibold",
                        day.isToday && !isSelected && "ring-2 ring-primary",
                        onDateSelect && day.isCurrentMonth && "cursor-pointer hover:bg-accent"
                      )}
                      onClick={() => handleDateClick(day)}
                      disabled={!day.isCurrentMonth || !onDateSelect}
                      data-testid={`calendar-day-${day.day}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          language === 'fa' && calendarType === 'jalali' && "font-vazir"
                        )}>
                          {day.day > 0 ? (
                            language === 'fa' && calendarType === 'jalali'
                              ? persianCalendar.toPersianDigits(day.day)
                              : day.day
                          ) : ''}
                        </span>
                        
                        {/* Holiday indicator */}
                        {isHoliday && (
                          <div className="absolute -top-1 -right-1">
                            <div className="h-2 w-2 bg-red-500 rounded-full" />
                          </div>
                        )}
                        
                        {/* Event indicator */}
                        {day.events && day.events.length > 0 && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="flex gap-1">
                              {day.events.slice(0, 3).map((event, index) => (
                                <div
                                  key={index}
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: event.color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Holiday legend */}
        {showHolidays && holidaysData?.holidays && (
          <div className="border-t p-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {language === 'fa' ? 'تعطیلات' : 'Holidays'}
            </h4>
            <div className="space-y-1">
              {holidaysData.holidays
                .filter((holiday: Holiday) => {
                  const holidayParts = holiday.persianDate.split('/');
                  return parseInt(holidayParts[1]) === currentPersianDate.month;
                })
                .slice(0, 3)
                .map((holiday: Holiday, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <span className={cn(
                      language === 'fa' && "font-vazir text-right"
                    )}>
                      {language === 'fa' ? holiday.name : holiday.name}
                    </span>
                    {holiday.isOfficial && (
                      <Badge variant="secondary" className="text-xs">
                        {language === 'fa' ? 'رسمی' : 'Official'}
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Calendar type indicator */}
        <div className="border-t p-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {calendarType === 'jalali' ? 'Persian Calendar' : 'Gregorian Calendar'}
            </Badge>
            {calendarNames?.source && (
              <Badge variant="secondary" className="text-xs">
                {calendarNames.source === 'keybit' ? 'Powered by Keybit' : 'Local'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}