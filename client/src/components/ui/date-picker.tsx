import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalizedCalendar } from "@/components/ui/localized-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useCalendarSettings } from "@/hooks/useCalendarSettings";
import { gregorianToPersian } from "@/lib/i18n";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function formatDateForLocale(date: Date, usePersian: boolean): string {
  if (usePersian) {
    try {
      const p = gregorianToPersian(date);
      return `${p.year}/${String(p.month).padStart(2, '0')}/${String(p.day).padStart(2, '0')}`;
    } catch {
      return format(date, "yyyy/MM/dd");
    }
  }
  return format(date, "yyyy/MM/dd");
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: DatePickerProps) {
  const { language } = useLanguage();
  const { usePersianCalendar } = useCalendarSettings();
  const defaultPlaceholder = language === 'fa' ? 'انتخاب تاریخ' : 'Pick a date';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-start font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="me-2 h-4 w-4 flex-shrink-0" />
          {value
            ? formatDateForLocale(value, usePersianCalendar)
            : <span>{placeholder ?? defaultPlaceholder}</span>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <LocalizedCalendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
