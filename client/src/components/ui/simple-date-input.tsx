import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimpleDateInputProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleDateInput({ value, onChange, placeholder = "Select date", className }: SimpleDateInputProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      setDay(value.getDate().toString().padStart(2, '0'));
      setMonth((value.getMonth() + 1).toString().padStart(2, '0'));
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  // Update parent when values change
  useEffect(() => {
    if (day && month && year) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
        const newDate = new Date(yearNum, monthNum - 1, dayNum);
        // Validate the date is actually valid (handles things like Feb 30)
        if (newDate.getDate() === dayNum && newDate.getMonth() === monthNum - 1 && newDate.getFullYear() === yearNum) {
          onChange?.(newDate);
        }
      }
    } else if (!day && !month && !year) {
      onChange?.(null);
    }
  }, [day, month, year, onChange]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
      setDay(value);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
      setMonth(value);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(value);
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
            maxLength={4}
            className="text-center"
          />
        </div>
      </div>
    </div>
  );
}