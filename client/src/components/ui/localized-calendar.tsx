import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { PersianCalendar } from "@/components/ui/persian-calendar";
import { useCalendarSettings } from "@/hooks/useCalendarSettings";

interface LocalizedCalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
  disabled?: (date: Date) => boolean;
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
      <PersianCalendar
        mode="manual"
        initialType="jalali"
        compact={true}
        showHolidays={false}
        showEvents={false}
        allowTypeSwitch={false}
        selectedDate={selected}
        onDateSelect={(date) => onSelect?.(date)}
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
