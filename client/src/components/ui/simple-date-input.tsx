import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimpleDateInputProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleDateInput({
  value,
  onChange,
  placeholder = "Select date",
  className,
}: SimpleDateInputProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);

  // Only initialize from value once
  useEffect(() => {
    if (!hasInitialized && value instanceof Date && !isNaN(value.getTime())) {
      setDay(value.getDate().toString().padStart(2, "0"));
      setMonth((value.getMonth() + 1).toString().padStart(2, "0"));
      setYear(value.getFullYear().toString());
      setHasInitialized(true);
    }
  }, [value, hasInitialized]);

  // Update parent when all fields are filled correctly
  useEffect(() => {
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (
        dayNum >= 1 &&
        dayNum <= 31 &&
        monthNum >= 1 &&
        monthNum <= 12 &&
        yearNum >= 1900 &&
        yearNum <= 2100
      ) {
        const newDate = new Date(yearNum, monthNum - 1, dayNum);
        newDate.setHours(12, 0, 0, 0); // Prevent timezone shift
        if (
          newDate.getDate() === dayNum &&
          newDate.getMonth() === monthNum - 1 &&
          newDate.getFullYear() === yearNum
        ) {
          onChange?.(newDate);
        }
      }
    } else if (!day && !month && !year) {
      onChange?.(null);
    }
  }, [day, month, year]);

  // Input Handlers
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(val);
    if (val.length === 2) {
      setTimeout(() => {
        const monthInput =
          e.target.parentElement?.parentElement?.children[1]?.querySelector(
            "input",
          );
        monthInput?.focus();
      }, 0);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMonth(val);
    if (val.length === 2) {
      setTimeout(() => {
        const yearInput =
          e.target.parentElement?.parentElement?.children[2]?.querySelector(
            "input",
          );
        yearInput?.focus();
      }, 0);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(val);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-gray-500">Day</Label>
          <Input
            type="text"
            placeholder="DD"
            value={day}
            onChange={handleDayChange}
            onFocus={(e) => e.target.select()}
            maxLength={2}
            className="text-center"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Month</Label>
          <Input
            type="text"
            placeholder="MM"
            value={month}
            onChange={handleMonthChange}
            onFocus={(e) => e.target.select()}
            maxLength={2}
            className="text-center"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Year</Label>
          <Input
            type="text"
            placeholder="YYYY"
            value={year}
            onChange={handleYearChange}
            onFocus={(e) => e.target.select()}
            maxLength={4}
            className="text-center"
          />
        </div>
      </div>
    </div>
  );
}
