import { useState, forwardRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: { hours: number; minutes: number } | null;
  onChange: (time: { hours: number; minutes: number } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ value, onChange, placeholder = "انتخاب زمان", disabled = false, className, "data-testid": dataTestId }, ref) => {
    const [open, setOpen] = useState(false);
    const [tempHours, setTempHours] = useState(value?.hours || 9);
    const [tempMinutes, setTempMinutes] = useState(value?.minutes || 0);

    const formatTime = (hours: number, minutes: number) => {
      const h = hours.toString().padStart(2, '0');
      const m = minutes.toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const handleTimeSelect = () => {
      onChange({ hours: tempHours, minutes: tempMinutes });
      setOpen(false);
    };

    const handleClear = () => {
      onChange(null);
      setOpen(false);
    };

    // Generate hour options (6 AM to 11 PM for business hours)
    const hourOptions = Array.from({ length: 18 }, (_, i) => i + 6);
    
    // Generate minute options (every 15 minutes)
    const minuteOptions = [0, 15, 30, 45];

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            data-testid={dataTestId}
          >
            <Clock className="ml-2 h-4 w-4" />
            {value ? formatTime(value.hours, value.minutes) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">انتخاب زمان</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-2 lg:px-3"
              >
                پاک کردن
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">ساعت</Label>
                <Select value={tempHours.toString()} onValueChange={(value) => setTempHours(parseInt(value))}>
                  <SelectTrigger id="hours" data-testid="time-picker-hours">
                    <SelectValue placeholder="ساعت" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minutes">دقیقه</Label>
                <Select value={tempMinutes.toString()} onValueChange={(value) => setTempMinutes(parseInt(value))}>
                  <SelectTrigger id="minutes" data-testid="time-picker-minutes">
                    <SelectValue placeholder="دقیقه" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>پیش‌نمایش زمان</Label>
              <div className="text-center text-lg font-mono bg-muted p-3 rounded-md" dir="ltr">
                {formatTime(tempHours, tempMinutes)}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                انصراف
              </Button>
              <Button
                className="flex-1"
                onClick={handleTimeSelect}
                data-testid="time-picker-confirm"
              >
                تایید
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

TimePicker.displayName = "TimePicker";

export { TimePicker };
export type { TimePickerProps };