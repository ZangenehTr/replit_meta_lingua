import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
// Removed formatPersianDate import - will use date-fns format instead

interface CreateClassModalProps {
  children: React.ReactNode;
}

interface TeacherAvailability {
  id: number;
  name: string;
  specializations: string[];
  competencyLevel: string;
  availableSlots: string[];
  currentLoad: number;
  maxCapacity: number;
  rating: number;
}

export function CreateClassModal({ children }: CreateClassModalProps) {
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [courseType, setCourseType] = useState("");
  const [level, setLevel] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showCalendarType, setShowCalendarType] = useState<'gregorian' | 'persian'>('gregorian');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['admin', 'common']);

  const { data: availableTeachers } = useQuery<TeacherAvailability[]>({
    queryKey: ['/api/manager/available-teachers', courseType, level, selectedDays, timeSlot],
    enabled: !!courseType && !!level,
  });

  const createClass = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/manager/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/classes'] });
      toast({
        title: t('toast.classCreated'),
        description: t('toast.classCreatedDescription'),
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t('toast.classFailed'),
        description: t('toast.classFailedDescription'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setClassName("");
    setCourseType("");
    setLevel("");
    setMaxStudents("");
    setStartDate(undefined);
    setEndDate(undefined);
    setDescription("");
    setSelectedDays([]);
    setTimeSlot("");
    setDuration("");
    setSelectedTeacher("");
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getTeacherCompatibility = (teacher: TeacherAvailability) => {
    const isSpecialized = teacher.specializations.some(spec => 
      spec.toLowerCase().includes(courseType.toLowerCase())
    );
    const hasCapacity = teacher.currentLoad < teacher.maxCapacity;
    const hasRequiredLevel = teacher.competencyLevel === level || 
      (teacher.competencyLevel === 'advanced' && level !== 'advanced');
    
    if (isSpecialized && hasCapacity && hasRequiredLevel) return 'excellent';
    if (hasCapacity && hasRequiredLevel) return 'good';
    if (hasCapacity) return 'fair';
    return 'poor';
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className || !courseType || !level || !startDate || !endDate || !selectedTeacher) {
      toast({
        title: t('toast.missingInformation'),
        description: t('toast.fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    createClass.mutate({
      name: className,
      courseType,
      level,
      maxStudents: parseInt(maxStudents) || 15,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      description,
      schedule: {
        days: selectedDays,
        timeSlot,
        duration: parseInt(duration) || 90,
      },
      teacherId: selectedTeacher,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">{t('classScheduling.scheduleNewClass')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="className">{t('classScheduling.course')} *</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder={t('placeholders.sessionTitle')}
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseType">{t('classScheduling.course')} *</Label>
              <Select value={courseType} onValueChange={setCourseType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('classScheduling.selectCourseToSchedule')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persian-grammar">دستور زبان فارسی</SelectItem>
                  <SelectItem value="persian-literature">ادبیات فارسی</SelectItem>
                  <SelectItem value="business-english">انگلیسی تجاری</SelectItem>
                  <SelectItem value="arabic-basics">عربی مقدماتی</SelectItem>
                  <SelectItem value="conversation">مکالمه</SelectItem>
                  <SelectItem value="writing">نگارش</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">{t('common.level')} *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('common.beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('common.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('common.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStudents">{t('classScheduling.maxStudents')}</Label>
              <Input
                id="maxStudents"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="15"
                min="5"
                max="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">{t('classScheduling.durationMinutes')}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectDuration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 {t('classScheduling.minutes')}</SelectItem>
                  <SelectItem value="45">45 {t('classScheduling.minutes')}</SelectItem>
                  <SelectItem value="60">60 {t('classScheduling.minutes')}</SelectItem>
                  <SelectItem value="90">90 {t('classScheduling.minutes')}</SelectItem>
                  <SelectItem value="120">120 {t('classScheduling.minutes')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('placeholders.sessionDescription')}
              rows={3}
              className="text-right"
            />
          </div>

          {/* Calendar Type Selector */}
          <div className="flex items-center space-x-4">
            <Label>نوع تقویم / Calendar Type:</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={showCalendarType === 'gregorian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCalendarType('gregorian')}
              >
                میلادی / Gregorian
              </Button>
              <Button
                type="button"
                variant={showCalendarType === 'persian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCalendarType('persian')}
              >
                شمسی / Persian
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاریخ شروع / Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : "انتخاب تاریخ / Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>تاریخ پایان / End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : "انتخاب تاریخ / Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Schedule Selection */}
          <div className="space-y-4">
            <Label>{t('classScheduling.date')} *</Label>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {[
                { en: 'Saturday', fa: 'شنبه' },
                { en: 'Sunday', fa: 'یکشنبه' },
                { en: 'Monday', fa: 'دوشنبه' },
                { en: 'Tuesday', fa: 'سه‌شنبه' },
                { en: 'Wednesday', fa: 'چهارشنبه' },
                { en: 'Thursday', fa: 'پنج‌شنبه' },
                { en: 'Friday', fa: 'جمعه' }
              ].map((day) => (
                <div key={day.en} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.en}
                    checked={selectedDays.includes(day.en)}
                    onCheckedChange={() => handleDayToggle(day.en)}
                  />
                  <Label htmlFor={day.en} className="text-sm">
                    {day.fa}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeSlot">{t('classScheduling.time')} *</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder={t('classScheduling.selectTime')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="14:00">14:00</SelectItem>
                <SelectItem value="16:00">16:00</SelectItem>
                <SelectItem value="18:00">18:00</SelectItem>
                <SelectItem value="20:00">20:00</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Assignment Based on Competency */}
          {availableTeachers && availableTeachers.length > 0 && (
            <div className="space-y-4">
              <Label>{t('classScheduling.availableTeachers')} *</Label>
              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                {availableTeachers.map((teacher) => {
                  const compatibility = getTeacherCompatibility(teacher);
                  return (
                    <div
                      key={teacher.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeacher === teacher.id.toString() 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTeacher(teacher.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            checked={selectedTeacher === teacher.id.toString()}
                            onChange={() => setSelectedTeacher(teacher.id.toString())}
                            className="text-blue-600"
                          />
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {teacher.specializations.join(', ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('classScheduling.capacity')}: {teacher.currentLoad}/{teacher.maxCapacity} کلاس
                              • {t('classScheduling.rating')}: {teacher.rating}★
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getCompatibilityColor(compatibility)}`}>
                          {compatibility === 'excellent' && t('classScheduling.teacherCompatibility.excellent')}
                          {compatibility === 'good' && t('classScheduling.teacherCompatibility.good')}
                          {compatibility === 'fair' && t('classScheduling.teacherCompatibility.fair')}
                          {compatibility === 'poor' && t('classScheduling.teacherCompatibility.poor')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('classScheduling.cancel')}
            </Button>
            <Button type="submit" disabled={createClass.isPending}>
              {createClass.isPending ? t('classScheduling.creating') : t('classScheduling.createClass')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}