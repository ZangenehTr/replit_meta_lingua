import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarSettings } from "@/hooks/useCalendarSettings";
import { persianCalendar } from "@/lib/persian-calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalizedCalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
  disabled?: (date: Date) => boolean;
}

function PersianDatePicker({
  selected,
  onSelect,
  className,
}: Pick<LocalizedCalendarProps, "selected" | "onSelect" | "className">) {
  const todayPersian = persianCalendar.gregorianToJalali(new Date());
  const selectedPersian = selected ? persianCalendar.gregorianToJalali(selected) : null;

  const [viewYear, setViewYear] = React.useState(
    selectedPersian?.year ?? todayPersian.year
  );
  const [viewMonth, setViewMonth] = React.useState(
    selectedPersian?.month ?? todayPersian.month
  );

  const monthNames = persianCalendar.getPersianMonthNames();
  const weekdayNames = persianCalendar.getPersianWeekdayNames();
  const grid = persianCalendar.generateCalendarGrid(viewYear, viewMonth);

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else { setViewMonth(m => m - 1); }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else { setViewMonth(m => m + 1); }
  };

  return (
    <div className={cn("p-3 space-y-2 select-none", className)} dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-7 w-7">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {monthNames[viewMonth - 1]} {persianCalendar.toPersianDigits(viewYear)}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {weekdayNames.map((wd) => (
          <div key={wd} className="h-9 w-9 flex items-center justify-center text-muted-foreground text-xs font-medium">
            {wd}
          </div>
        ))}

        {grid.flat().map((cell, idx) => {
          if (!cell || cell.day === 0) {
            return <div key={`empty-${idx}`} className="h-9 w-9" />;
          }

          const cellPersian = persianCalendar.gregorianToJalali(cell.gregorianDate);

          const isSelected =
            selectedPersian?.year === cellPersian.year &&
            selectedPersian?.month === cellPersian.month &&
            selectedPersian?.day === cellPersian.day;

          const isToday =
            todayPersian.year === cellPersian.year &&
            todayPersian.month === cellPersian.month &&
            todayPersian.day === cellPersian.day;

          return (
            <button
              key={`${cellPersian.year}-${cellPersian.month}-${cellPersian.day}`}
              onClick={() => onSelect?.(cell.gregorianDate)}
              className={cn(
                "h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors",
                !cell.isCurrentMonth && "text-muted-foreground opacity-50",
                isToday && !isSelected && "border border-primary",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {persianCalendar.toPersianDigits(cell.day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LocalizedCalendar({
  mode = "single",
  selected,
  onSelect,
  initialFocus,
  className,
  disabled,
}: LocalizedCalendarProps) {
  const { usePersianCalendar } = useCalendarSettings();

  if (usePersianCalendar) {
    return (
      <PersianDatePicker
        selected={selected}
        onSelect={onSelect}
        className={className}
      />
    );
  }

  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      initialFocus={initialFocus}
      className={className}
      disabled={disabled}
    />
  );
}
