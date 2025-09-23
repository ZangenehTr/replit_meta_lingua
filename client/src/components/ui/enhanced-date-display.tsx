import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { 
  Calendar,
  Clock,
  Globe
} from "lucide-react";

interface CalendarContext {
  persianDate: string;
  gregorianDate: string;
  culturalSignificance?: string;
}

interface EnhancedDateDisplayProps {
  date: string;
  time?: string;
  calendarContext?: CalendarContext;
  showBoth?: boolean;
  compact?: boolean;
  primary?: 'persian' | 'gregorian' | 'auto';
  className?: string;
}

const formatRelativeDate = (dateString: string, language: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const rtlLanguages = ['fa', 'ar'];
  const isRTL = rtlLanguages.includes(language);

  if (diffDays === 0) {
    return isRTL ? 'امروز' : 'Today';
  } else if (diffDays === 1) {
    return isRTL ? 'فردا' : 'Tomorrow';
  } else if (diffDays === -1) {
    return isRTL ? 'دیروز' : 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    return isRTL ? `${diffDays} روز دیگر` : `In ${diffDays} days`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return isRTL ? `${Math.abs(diffDays)} روز پیش` : `${Math.abs(diffDays)} days ago`;
  }

  return '';
};

const formatPersianWeekday = (date: Date): string => {
  const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return weekdays[date.getDay()];
};

const formatTime = (timeString: string, is24Hour: boolean = false): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: !is24Hour
    });
  } catch {
    return timeString;
  }
};

export function EnhancedDateDisplay({ 
  date, 
  time, 
  calendarContext, 
  showBoth = false,
  compact = false,
  primary = 'auto',
  className 
}: EnhancedDateDisplayProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  
  // Determine primary calendar based on language if auto
  const effectivePrimary = primary === 'auto' 
    ? (isRTL ? 'persian' : 'gregorian')
    : primary;

  const dateObj = new Date(date);
  const relativeDate = formatRelativeDate(date, i18n.language);

  // Format Gregorian date
  const gregorianDate = dateObj.toLocaleDateString(
    isRTL ? 'fa-IR' : 'en-US', 
    { 
      weekday: compact ? 'short' : 'long',
      year: 'numeric', 
      month: compact ? 'short' : 'long', 
      day: 'numeric' 
    }
  );

  // Use provided Persian date or generate one
  const persianDate = calendarContext?.persianDate || gregorianDate;
  const persianWeekday = formatPersianWeekday(dateObj);

  const formattedTime = time ? formatTime(time, isRTL) : null;

  return (
    <div className={cn("flex flex-col space-y-1", className)} data-testid="enhanced-date-display">
      {/* Primary Date Display */}
      <div className="flex items-center gap-2">
        <Calendar className={cn("w-4 h-4 text-muted-foreground", compact && "w-3 h-3")} />
        <div className="flex flex-col">
          <div className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
            {effectivePrimary === 'persian' ? (
              <span className="flex items-center gap-1" dir="rtl">
                {isRTL && persianWeekday && !compact && (
                  <span className="text-muted-foreground">{persianWeekday}</span>
                )}
                {persianDate}
              </span>
            ) : (
              <span>
                {gregorianDate}
              </span>
            )}
            
            {relativeDate && (
              <span className={cn(
                "ml-2 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary",
                isRTL && "mr-2 ml-0"
              )}>
                {relativeDate}
              </span>
            )}
          </div>
          
          {/* Secondary Date (if showing both calendars) */}
          {showBoth && (
            <div className={cn(
              "text-sm text-muted-foreground", 
              compact && "text-xs"
            )}>
              {effectivePrimary === 'persian' ? gregorianDate : persianDate}
            </div>
          )}
        </div>
      </div>

      {/* Time Display */}
      {formattedTime && (
        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4 text-muted-foreground", compact && "w-3 h-3")} />
          <span className={cn("text-sm text-muted-foreground", compact && "text-xs")}>
            {formattedTime}
          </span>
        </div>
      )}

      {/* Cultural Significance */}
      {calendarContext?.culturalSignificance && (
        <div className="flex items-center gap-2">
          <Globe className={cn("w-4 h-4 text-amber-500", compact && "w-3 h-3")} />
          <span className={cn(
            "text-sm text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md",
            compact && "text-xs px-1.5 py-0.5",
            isRTL && "text-right"
          )} dir={isRTL ? "rtl" : "ltr"}>
            {calendarContext.culturalSignificance}
          </span>
        </div>
      )}
    </div>
  );
}