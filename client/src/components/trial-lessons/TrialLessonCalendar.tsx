import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, addMinutes, parseISO } from "date-fns";
import { Clock, User, Video, MapPin, Phone, Plus, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TrialLessonBookingForm } from "./TrialLessonBookingForm";

interface TrialLesson {
  id: number;
  studentFirstName: string;
  studentLastName: string;
  studentName?: string; // Computed field for backward compatibility
  studentPhone: string;
  studentEmail: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  lessonType: 'in_person' | 'online' | 'phone';
  targetLanguage: string;
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  attendanceStatus?: 'pending' | 'attended' | 'no_show' | 'late' | 'early_departure';
  assignedTeacherId?: number;
  assignedTeacherName?: string;
  notes?: string;
  room?: string;
}

interface TrialLessonResponse {
  lessons: TrialLesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  conflicts?: TrialLesson[];
  teacherAvailable: boolean;
}

interface TrialLessonCalendarProps {
  className?: string;
}

export function TrialLessonCalendar({ className }: TrialLessonCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Fetch trial lessons for the selected month
  const { data, isLoading, error } = useQuery<TrialLessonResponse>({
    queryKey: ['/api/trial-lessons', selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const response = await fetch(`/api/trial-lessons?dateFrom=${startOfMonth.toISOString().split('T')[0]}&dateTo=${endOfMonth.toISOString().split('T')[0]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trial lessons');
      }
      return response.json();
    }
  });

  // Extract lessons and add computed studentName field
  const trialLessons = (data?.lessons || []).map(lesson => ({
    ...lesson,
    studentName: lesson.studentName || `${lesson.studentFirstName} ${lesson.studentLastName}`.trim()
  }));

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleTrialLessonUpdate = (data: any) => {
      console.log('Received trial lesson update:', data);
      // Invalidate calendar queries to refetch latest data
      queryClient.invalidateQueries({
        queryKey: ['/api/trial-lessons']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/teachers/available-slots']
      });
    };

    const handleTrialLessonCreated = (data: any) => {
      console.log('Trial lesson created:', data);
      handleTrialLessonUpdate(data);
      toast({
        title: "New trial lesson booked",
        description: `A new trial lesson was scheduled for ${data.studentFirstName || 'student'} ${data.studentLastName || ''}`.trim(),
      });
    };

    const handleTrialLessonAssigned = (data: any) => {
      console.log('Trial lesson assigned:', data);
      handleTrialLessonUpdate(data);
      toast({
        title: "Teacher assigned",
        description: `Teacher ${data.teacherName || 'was assigned'} to trial lesson`,
      });
    };

    const handleTrialLessonCancelled = (data: any) => {
      console.log('Trial lesson cancelled:', data);
      handleTrialLessonUpdate(data);
      toast({
        title: "Trial lesson cancelled",
        description: `Trial lesson for ${data.studentFirstName || 'student'} ${data.studentLastName || ''} was cancelled`.trim(),
        variant: "destructive"
      });
    };

    // Subscribe to socket events
    socket.on('trial-lesson-created', handleTrialLessonCreated);
    socket.on('trial-lesson-updated', handleTrialLessonUpdate);
    socket.on('trial-lesson-assigned', handleTrialLessonAssigned);
    socket.on('trial-lesson-cancelled', handleTrialLessonCancelled);

    return () => {
      // Clean up event listeners
      socket.off('trial-lesson-created', handleTrialLessonCreated);
      socket.off('trial-lesson-updated', handleTrialLessonUpdate);
      socket.off('trial-lesson-assigned', handleTrialLessonAssigned);
      socket.off('trial-lesson-cancelled', handleTrialLessonCancelled);
    };
  }, [socket, queryClient, toast]);

  // Fetch teacher availability for the selected date
  const { data: teacherAvailability = [] } = useQuery({
    queryKey: ['/api/teachers/available-slots', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await fetch(`/api/teachers/available-slots?date=${selectedDate.toISOString().split('T')[0]}`);
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No availability data available
        }
        throw new Error('Failed to fetch teacher availability');
      }
      return response.json();
    },
    enabled: !!selectedDate
  });

  // Get lessons for the selected date
  const selectedDateLessons = trialLessons.filter(lesson => 
    isSameDay(parseISO(lesson.scheduledDate), selectedDate)
  );

  // Generate time slots for the selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8:00 AM
    const endHour = 20;  // 8:00 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check for existing bookings/conflicts
        const conflicts = selectedDateLessons.filter(lesson => {
          const lessonStart = lesson.scheduledStartTime;
          const lessonEnd = lesson.scheduledEndTime;
          return time >= lessonStart && time < lessonEnd && 
                 lesson.bookingStatus !== 'cancelled';
        });

        // Check teacher availability (simplified - would need more complex logic)
        const teacherAvailable = teacherAvailability.some((avail: any) => 
          time >= avail.startTime && time < avail.endTime
        );

        slots.push({
          time,
          available: conflicts.length === 0 && teacherAvailable,
          conflicts,
          teacherAvailable
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle booking a new trial lesson
  const handleBookTimeSlot = (time: string) => {
    setSelectedTimeSlot(time);
    setBookingDialogOpen(true);
  };

  // Get status color for lessons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // Handle successful booking
  const handleBookingSuccess = () => {
    setBookingDialogOpen(false);
    setSelectedTimeSlot(null);
    queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
    toast({
      title: "Trial lesson booked successfully",
      description: "Confirmation SMS has been sent to the student",
    });
  };

  return (
    <div className={cn("space-y-6", className)} data-testid="trial-lesson-calendar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trial Lesson Calendar</h2>
          <p className="text-muted-foreground">
            Manage trial lesson bookings and teacher assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            data-testid="view-calendar"
          >
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-testid="view-list"
          >
            List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Select Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                booked: trialLessons.map(lesson => parseISO(lesson.scheduledDate))
              }}
              modifiersStyles={{
                booked: { backgroundColor: 'rgb(59 130 246 / 0.1)' }
              }}
              data-testid="trial-calendar-picker"
            />
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-blue-100"></div>
                <span className="text-sm">Has bookings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots & Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} - Available Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      slot.available 
                        ? "bg-green-50 border-green-200 hover:bg-green-100" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{slot.time}</span>
                      
                      {slot.conflicts && slot.conflicts.length > 0 && (
                        <div className="flex space-x-2">
                          {slot.conflicts.map((lesson) => (
                            <div key={lesson.id} className="flex items-center space-x-2">
                              <Badge 
                                className={cn("text-white", getStatusColor(lesson.bookingStatus))}
                                data-testid={`lesson-badge-${lesson.id}`}
                              >
                                {lesson.studentName}
                              </Badge>
                              {getLessonTypeIcon(lesson.lessonType)}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!slot.teacherAvailable && slot.conflicts.length === 0 && (
                        <Badge variant="secondary" className="text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No teacher available
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {slot.available && (
                        <Button
                          size="sm"
                          onClick={() => handleBookTimeSlot(slot.time)}
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid={`book-slot-${slot.time}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Book
                        </Button>
                      )}
                      
                      {slot.conflicts && slot.conflicts.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {slot.conflicts.length} booking{slot.conflicts.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Trial Lessons Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedDateLessons.filter(l => l.bookingStatus === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {selectedDateLessons.filter(l => l.bookingStatus === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedDateLessons.filter(l => l.bookingStatus === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {selectedDateLessons.filter(l => l.attendanceStatus === 'no_show').length}
              </div>
              <div className="text-sm text-muted-foreground">No Shows</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Book Trial Lesson - {format(selectedDate, 'EEEE, MMMM d')} at {selectedTimeSlot}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTimeSlot && (
            <TrialLessonBookingForm
              selectedDate={selectedDate}
              selectedTime={selectedTimeSlot}
              onSuccess={handleBookingSuccess}
              onCancel={() => setBookingDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}