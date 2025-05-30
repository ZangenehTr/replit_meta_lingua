import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface IOSDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function IOSDatePicker({ value, onChange, placeholder = "Pick a date", className }: IOSDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  
  // Initialize with current date or selected date
  const initDate = selectedDate || new Date();
  const [month, setMonth] = useState(initDate.getMonth());
  const [day, setDay] = useState(initDate.getDate());
  const [year, setYear] = useState(initDate.getFullYear());

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const yearRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1);

  // Scroll wheel component
  const ScrollWheel = ({ 
    items, 
    selectedIndex, 
    onSelect, 
    refs,
    formatItem = (item) => item.toString()
  }: {
    items: any[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    formatItem?: (item: any) => string;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToIndex = (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      
      const itemHeight = 44; // Height of each item
      const scrollTop = index * itemHeight - (container.clientHeight / 2) + (itemHeight / 2);
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToIndex(selectedIndex);
    }, [selectedIndex]);

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const itemHeight = 44;
      const scrollTop = container.scrollTop;
      const centerIndex = Math.round((scrollTop + container.clientHeight / 2 - itemHeight / 2) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, centerIndex));
      
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    };

    return (
      <div 
        ref={containerRef}
        className="h-44 overflow-y-auto scrollbar-hide relative"
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Gradient overlays for iOS effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        
        {/* Selection highlight */}
        <div className="absolute left-0 right-0 bg-gray-100 h-11 top-16 z-5 pointer-events-none rounded" />
        
        {/* Padding for proper centering */}
        <div className="h-16" />
        
        {items.map((item, index) => (
          <div
            key={index}
            ref={el => refs.current[index] = el}
            className={`
              h-11 flex items-center justify-center text-lg transition-all duration-200 cursor-pointer
              ${index === selectedIndex 
                ? 'font-semibold text-gray-900 scale-110' 
                : Math.abs(index - selectedIndex) === 1
                  ? 'text-gray-600 scale-105'
                  : 'text-gray-400 scale-100'
              }
            `}
            onClick={() => {
              onSelect(index);
              scrollToIndex(index);
            }}
          >
            {formatItem(item)}
          </div>
        ))}
        
        {/* Padding for proper centering */}
        <div className="h-16" />
      </div>
    );
  };

  const handleConfirm = () => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (selectedDate) {
      setMonth(selectedDate.getMonth());
      setDay(selectedDate.getDate());
      setYear(selectedDate.getFullYear());
    }
    setIsOpen(false);
  };

  // Update day when month or year changes
  useEffect(() => {
    const maxDays = getDaysInMonth(month, year);
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [month, year]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className || ''}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
          </div>
          
          {/* Date picker wheels */}
          <div className="flex">
            {/* Month wheel */}
            <div className="flex-1 border-r">
              <div className="text-center py-2 text-sm font-medium text-gray-600 bg-gray-50">
                Month
              </div>
              <ScrollWheel
                items={months}
                selectedIndex={month}
                onSelect={setMonth}
                refs={monthRefs}
                formatItem={(item) => item.slice(0, 3)} // Show abbreviated month
              />
            </div>
            
            {/* Day wheel */}
            <div className="flex-1 border-r">
              <div className="text-center py-2 text-sm font-medium text-gray-600 bg-gray-50">
                Day
              </div>
              <ScrollWheel
                items={days}
                selectedIndex={day - 1}
                onSelect={(index) => setDay(index + 1)}
                refs={dayRefs}
              />
            </div>
            
            {/* Year wheel */}
            <div className="flex-1">
              <div className="text-center py-2 text-sm font-medium text-gray-600 bg-gray-50">
                Year
              </div>
              <ScrollWheel
                items={years}
                selectedIndex={years.indexOf(year)}
                onSelect={(index) => setYear(years[index])}
                refs={yearRefs}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex border-t bg-gray-50">
            <Button
              variant="ghost"
              className="flex-1 rounded-none text-red-600 hover:bg-red-50"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <div className="w-px bg-gray-200" />
            <Button
              variant="ghost"
              className="flex-1 rounded-none text-blue-600 hover:bg-blue-50 font-semibold"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}