import { useState, useEffect, useRef } from "react";
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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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

  const IOSWheelPicker = ({ 
    items, 
    selectedIndex, 
    onSelect, 
    label 
  }: {
    items: (string | number)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    label: string;
  }) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentTranslate, setCurrentTranslate] = useState(0);

    const itemHeight = 44;
    const visibleItems = 5;
    const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

    useEffect(() => {
      setCurrentTranslate(-selectedIndex * itemHeight + centerOffset);
    }, [selectedIndex, centerOffset]);

    const handleStart = (clientY: number) => {
      setIsDragging(true);
      setStartY(clientY);
    };

    const handleMove = (clientY: number) => {
      if (!isDragging) return;
      
      const deltaY = clientY - startY;
      const newTranslate = -selectedIndex * itemHeight + centerOffset + deltaY;
      setCurrentTranslate(newTranslate);
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      const newIndex = Math.round((-currentTranslate + centerOffset) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      onSelect(clampedIndex);
    };

    return (
      <div className="flex-1">
        <div className="text-center text-sm font-medium text-gray-600 mb-2">{label}</div>
        <div className="relative h-48 overflow-hidden bg-white dark:bg-gray-900 rounded-lg">
          {/* Selection indicator */}
          <div className="absolute inset-x-0 top-20 h-11 border-y border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 pointer-events-none z-10" />
          
          {/* Wheel container */}
          <div
            ref={wheelRef}
            className="absolute inset-x-0 cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateY(${currentTranslate}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
            }}
            onMouseDown={(e) => handleStart(e.clientY)}
            onMouseMove={(e) => handleMove(e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientY)}
            onTouchMove={(e) => {
              e.preventDefault();
              handleMove(e.touches[0].clientY);
            }}
            onTouchEnd={handleEnd}
          >
            {items.map((item, index) => {
              const offset = index * itemHeight - (-currentTranslate - centerOffset);
              const distance = Math.abs(offset) / itemHeight;
              const opacity = Math.max(0.6, 1 - distance * 0.2);
              const scale = Math.max(0.85, 1 - distance * 0.08);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-center text-lg font-semibold select-none text-gray-900 dark:text-gray-100"
                  style={{
                    height: `${itemHeight}px`,
                    opacity,
                    transform: `scale(${scale})`,
                    color: index === selectedIndex ? '#007AFF' : undefined,
                    fontWeight: index === selectedIndex ? '600' : '500'
                  }}
                  onClick={() => onSelect(index)}
                >
                  {item}
                </div>
              );
            })}
          </div>
          
          {/* Gradient overlays for iOS effect */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-20" />
        </div>
      </div>
    );
  };

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
      <PopoverContent className="w-80 p-0">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-t-lg">
          <h4 className="font-medium text-center text-gray-900 dark:text-gray-100">Select Date</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <IOSWheelPicker
              items={months}
              selectedIndex={month}
              onSelect={setMonth}
              label="Month"
            />
            <IOSWheelPicker
              items={days}
              selectedIndex={day - 1}
              onSelect={(index) => setDay(index + 1)}
              label="Day"
            />
            <IOSWheelPicker
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
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              onClick={handleDateChange}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}