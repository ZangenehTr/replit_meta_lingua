import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { 
  Star, 
  Moon, 
  Sun, 
  Sparkles,
  Heart,
  Crown
} from "lucide-react";

interface Holiday {
  id: number;
  name: string;
  namePersian: string;
  nameArabic?: string;
  type: string;
  description: string;
  descriptionPersian?: string;
  isOfficialHoliday: boolean;
  color: string;
}

interface HolidayIndicatorProps {
  holidays: Holiday[];
  compact?: boolean;
  className?: string;
}

const getHolidayIcon = (type: string, holidayName: string) => {
  // Persian/Iranian holidays
  if (holidayName.toLowerCase().includes('nowruz') || holidayName.includes('نوروز')) {
    return <Sparkles className="w-3 h-3" />;
  }
  
  if (holidayName.toLowerCase().includes('yalda') || holidayName.includes('یلدا')) {
    return <Moon className="w-3 h-3" />;
  }

  // Islamic holidays
  if (type === 'religious' || holidayName.toLowerCase().includes('ramadan') || holidayName.includes('رمضان')) {
    return <Moon className="w-3 h-3" />;
  }

  if (holidayName.toLowerCase().includes('eid') || holidayName.includes('عید')) {
    return <Star className="w-3 h-3" />;
  }

  // Seasonal/Cultural
  if (type === 'seasonal') {
    return <Sun className="w-3 h-3" />;
  }

  if (type === 'national') {
    return <Crown className="w-3 h-3" />;
  }

  // Default
  return <Heart className="w-3 h-3" />;
};

const getHolidayTypeStyles = (type: string, isOfficial: boolean) => {
  const baseStyles = "text-white border-none shadow-sm";
  
  switch (type) {
    case 'cultural':
      return `${baseStyles} bg-gradient-to-r from-emerald-500 to-green-600`;
    case 'religious':
      return `${baseStyles} bg-gradient-to-r from-blue-500 to-indigo-600`;
    case 'national':
      return `${baseStyles} bg-gradient-to-r from-red-500 to-rose-600`;
    case 'seasonal':
      return `${baseStyles} bg-gradient-to-r from-amber-500 to-orange-600`;
    default:
      return `${baseStyles} bg-gradient-to-r from-purple-500 to-violet-600`;
  }
};

export function HolidayIndicator({ holidays, compact = false, className }: HolidayIndicatorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  if (!holidays || holidays.length === 0) return null;

  // Show only the first holiday if multiple
  const primaryHoliday = holidays[0];
  const hasMultiple = holidays.length > 1;

  const holidayName = isRTL && primaryHoliday.namePersian 
    ? primaryHoliday.namePersian 
    : primaryHoliday.name;

  const description = isRTL && primaryHoliday.descriptionPersian 
    ? primaryHoliday.descriptionPersian
    : primaryHoliday.description;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            <Badge 
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs font-medium",
                getHolidayTypeStyles(primaryHoliday.type, primaryHoliday.isOfficialHoliday),
                compact && "px-1.5 py-0.5 text-xs"
              )}
              data-testid={`holiday-badge-${primaryHoliday.id}`}
            >
              {getHolidayIcon(primaryHoliday.type, primaryHoliday.name)}
              <span className={cn("max-w-[120px] truncate", compact && "max-w-[80px]")}>
                {holidayName}
              </span>
              {hasMultiple && (
                <span className="text-xs opacity-80">+{holidays.length - 1}</span>
              )}
            </Badge>
            
            {primaryHoliday.isOfficialHoliday && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-sm" 
                   title={t('common:officialHoliday', 'Official Holiday')} />
            )}
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side={isRTL ? "left" : "right"}
          className="max-w-xs"
          data-testid={`holiday-tooltip-${primaryHoliday.id}`}
        >
          <div className={cn("space-y-2", isRTL && "text-right")}>
            <div className="font-semibold">
              {holidayName}
              {primaryHoliday.isOfficialHoliday && (
                <span className="ml-2 text-yellow-400">★</span>
              )}
            </div>
            
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}

            {hasMultiple && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  {t('calendar:moreHolidays', 'And {{count}} more holidays', { count: holidays.length - 1 })}
                </p>
                <div className="mt-1 space-y-1">
                  {holidays.slice(1, 3).map((holiday) => (
                    <div key={holiday.id} className="text-xs">
                      {isRTL && holiday.namePersian ? holiday.namePersian : holiday.name}
                    </div>
                  ))}
                  {holidays.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      {t('calendar:andMore', '...')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}