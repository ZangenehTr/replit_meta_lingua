import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface RotatingDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function RotatingDatePicker({ value, onChange, placeholder = "Pick a date", className }: RotatingDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [year, setYear] = useState(selectedDate?.getFullYear() || new Date().getFullYear());
  const [month, setMonth] = useState(selectedDate?.getMonth() || new Date().getMonth());
  const [day, setDay] = useState(selectedDate?.getDate() || new Date().getDate());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setYear(value.getFullYear());
      setMonth(value.getMonth());
      setDay(value.getDate());
    }
  }, [value]);

  const handleDateChange = () => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const WheelSelector = ({ 
    items, 
    selectedIndex, 
    onSelect, 
    label 
  }: {
    items: (string | number)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    label: string;
  }) => (
    <div className="flex-1">
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div className="h-32 overflow-hidden border rounded-lg bg-gray-50 dark:bg-gray-800 relative">
        <div 
          className="absolute inset-x-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${-selectedIndex * 32 + 48}px)`
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className={`h-8 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-blue-500 text-white font-medium scale-105'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => onSelect(index)}
            >
              {item}
            </div>
          ))}
        </div>
        {/* Selection indicator */}
        <div className="absolute inset-x-0 top-12 h-8 border-y-2 border-blue-500 pointer-events-none bg-blue-500/10" />
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium text-center">Select Date</h4>
          <div className="flex gap-3">
            <WheelSelector
              items={months}
              selectedIndex={month}
              onSelect={setMonth}
              label="Month"
            />
            <WheelSelector
              items={days}
              selectedIndex={day - 1}
              onSelect={(index) => setDay(index + 1)}
              label="Day"
            />
            <WheelSelector
              items={years}
              selectedIndex={years.indexOf(year)}
              onSelect={(index) => setYear(years[index])}
              label="Year"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleDateChange}
            >
              Select
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}