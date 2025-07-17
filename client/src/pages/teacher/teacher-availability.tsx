import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus,
  Edit,
  Trash2,
  Check,
  X
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const timeSlotSchema = z.object({
  dayOfWeek: z.string().min(1, "Day of week is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  isRecurring: z.boolean().default(true),
  specificDate: z.string().optional(),
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

interface TimeSlot {
  id: number;
  teacherId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  isActive: boolean;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function TeacherAvailability() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      isRecurring: true,
      specificDate: "",
    },
  });

  const { data: timeSlots = [], isLoading, error } = useQuery({
    queryKey: ['/api/teacher/availability'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/teacher/availability', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          console.warn('Teacher availability API failed:', response.status);
          return [];
        }
        return response.json();
      } catch (error) {
        console.warn('Teacher availability error:', error);
        return [];
      }
    },
    retry: false,
    throwOnError: false,
  });

  const createTimeSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      return apiRequest('/api/teacher/availability', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Time slot created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create time slot",
        variant: "destructive",
      });
    },
  });

  const updateTimeSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      return apiRequest(`/api/teacher/availability/${editingSlot?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      setIsDialogOpen(false);
      setEditingSlot(null);
      form.reset();
      toast({
        title: "Success",
        description: "Time slot updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update time slot",
        variant: "destructive",
      });
    },
  });

  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      return apiRequest(`/api/teacher/availability/${slotId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    },
  });

  const toggleSlotMutation = useMutation({
    mutationFn: async ({ slotId, isActive }: { slotId: number; isActive: boolean }) => {
      return apiRequest(`/api/teacher/availability/${slotId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      toast({
        title: "Success",
        description: "Time slot status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update time slot status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimeSlotFormData) => {
    if (editingSlot) {
      updateTimeSlotMutation.mutate(data);
    } else {
      createTimeSlotMutation.mutate(data);
    }
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    form.setValue('dayOfWeek', slot.dayOfWeek);
    form.setValue('startTime', slot.startTime);
    form.setValue('endTime', slot.endTime);
    form.setValue('isRecurring', slot.isRecurring);
    form.setValue('specificDate', slot.specificDate || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (slotId: number) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      deleteTimeSlotMutation.mutate(slotId);
    }
  };

  const handleToggle = (slotId: number, currentStatus: boolean) => {
    toggleSlotMutation.mutate({ slotId, isActive: !currentStatus });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('teacher.availability')}</h1>
          <p className="text-muted-foreground">
            {t('teacher.manageYourAvailabilityForClassScheduling')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingSlot(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('teacher.addTimeSlot')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSlot ? t('teacher.editTimeSlot') : t('teacher.addTimeSlot')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teacher.dayOfWeek')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('teacher.selectDay')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('teacher.startTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('teacher.endTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTimeSlotMutation.isPending || updateTimeSlotMutation.isPending}
                  >
                    {editingSlot ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeSlots?.map((slot: TimeSlot) => (
          <Card key={slot.id} className={`relative ${!slot.isActive ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg capitalize">
                  {slot.dayOfWeek}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={slot.isActive ? "default" : "secondary"}>
                    {slot.isActive ? t('teacher.active') : t('teacher.inactive')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(slot.id, slot.isActive)}
                  >
                    {slot.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </div>
                
                {slot.specificDate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {slot.specificDate}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(slot)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {timeSlots?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('teacher.noTimeSlots')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('teacher.addTimeSlotToGetStarted')}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('teacher.addTimeSlot')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}