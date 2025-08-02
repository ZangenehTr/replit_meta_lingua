import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Video,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Search,
  Settings,
  User,
  MapPin,
  Globe,
  Repeat,
  Bell
} from 'lucide-react';

interface ClassSession {
  id: number;
  title: string;
  courseId: number;
  teacherId: number;
  teacherName: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxStudents: number;
  enrolledStudents: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: string;
  description?: string;
  level: string;
  language: string;
  type: 'online' | 'in-person' | 'hybrid';
}

interface Teacher {
  id: number;
  name: string;
  specializations: string[];
  availability: any[];
  rating: number;
}

interface ClassRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  type: 'physical' | 'virtual';
  isAvailable: boolean;
}

export default function AdminClassesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [filters, setFilters] = useState({
    teacher: '',
    room: '',
    level: '',
    language: '',
    type: ''
  });

  // Fetch all scheduled classes
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/admin/class-sessions', selectedDate, viewMode],
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['/api/admin/rooms'],
  });

  // Create new class session
  const createSession = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/class-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/class-sessions'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classScheduled') });
      setIsCreateDialogOpen(false);
    }
  });

  // Update class session
  const updateSession = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/class-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/class-sessions'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classUpdated') });
    }
  });

  // Delete class session
  const deleteSession = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/class-sessions/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/class-sessions'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classDeleted') });
    }
  });

  // Filter sessions based on selected filters
  const filteredSessions = (sessions as ClassSession[] || []).filter((session: ClassSession) => {
    if (filters.teacher && filters.teacher !== 'all' && session.teacherId !== parseInt(filters.teacher)) return false;
    if (filters.room && filters.room !== 'all' && session.roomId !== filters.room) return false;
    if (filters.level && filters.level !== 'all' && session.level !== filters.level) return false;
    if (filters.language && filters.language !== 'all' && session.language !== filters.language) return false;
    if (filters.type && filters.type !== 'all' && session.type !== filters.type) return false;
    return true;
  });

  // Generate calendar days based on view mode
  const getCalendarDays = () => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(selectedDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const calendarDays = getCalendarDays();

  // Get sessions for a specific day
  const getSessionsForDay = (date: Date) => {
    return (filteredSessions || []).filter((session: ClassSession) => 
      isSameDay(new Date(session.startTime), date)
    );
  };

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, -1));
    } else if (viewMode === 'week') {
      setSelectedDate(addDays(selectedDate, -7));
    } else {
      setSelectedDate(addDays(selectedDate, -30));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(addDays(selectedDate, 7));
    } else {
      setSelectedDate(addDays(selectedDate, 30));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('admin:classes.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('admin:classes.subtitle')}
          </p>
        </div>

        {/* Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* View Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={navigatePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={navigateNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                    {t('common.today')}
                  </Button>
                </div>
                
                <h2 className="text-lg font-semibold">
                  {viewMode === 'day' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d, yyyy')}`}
                  {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                </h2>
              </div>

              {/* View Mode Tabs */}
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="day">{t('common.day')}</TabsTrigger>
                  <TabsTrigger value="week">{t('common.week')}</TabsTrigger>
                  <TabsTrigger value="month">{t('common.month')}</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('classScheduling.scheduleClass')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('classScheduling.scheduleNewClass')}</DialogTitle>
                    </DialogHeader>
                    <ClassScheduleForm 
                      teachers={teachers}
                      rooms={rooms}
                      onSubmit={(data) => createSession.mutate(data)}
                      isPending={createSession.isPending}
                    />
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
              <Select value={filters.teacher} onValueChange={(v) => setFilters({ ...filters, teacher: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('filters.allTeachers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allTeachers')}</SelectItem>
                  {(teachers as Teacher[] || []).map((teacher: Teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.room} onValueChange={(v) => setFilters({ ...filters, room: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('filters.allRooms')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allRooms')}</SelectItem>
                  {(rooms as ClassRoom[] || []).map((room: ClassRoom) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardContent className="p-6">
            {sessionsLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading schedule...</p>
                </div>
              </div>
            ) : viewMode === 'month' ? (
              <MonthView 
                days={calendarDays} 
                sessions={filteredSessions}
                onSessionClick={setSelectedSession}
              />
            ) : (
              <WeekDayView 
                days={calendarDays}
                sessions={filteredSessions}
                onSessionClick={setSelectedSession}
                viewMode={viewMode}
              />
            )}
          </CardContent>
        </Card>

        {/* Session Details Dialog */}
        {selectedSession && (
          <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedSession.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Teacher</Label>
                    <p className="font-medium">{selectedSession.teacherName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Room</Label>
                    <p className="font-medium">{selectedSession.roomName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Time</Label>
                    <p className="font-medium">
                      {format(new Date(selectedSession.startTime), 'h:mm a')} - 
                      {format(new Date(selectedSession.endTime), 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Students</Label>
                    <p className="font-medium">
                      {selectedSession.enrolledStudents} / {selectedSession.maxStudents}
                    </p>
                  </div>
                </div>
                {selectedSession.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedSession.description}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this class?')) {
                        deleteSession.mutate(selectedSession.id);
                        setSelectedSession(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// Component for week/day view
function WeekDayView({ 
  days, 
  sessions, 
  onSessionClick,
  viewMode 
}: { 
  days: Date[], 
  sessions: ClassSession[],
  onSessionClick: (session: ClassSession) => void,
  viewMode: 'day' | 'week'
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Time slots header */}
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <div></div>
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} gap-2`}>
            {days.map((day) => (
              <div 
                key={day.toISOString()} 
                className={`text-center p-2 font-medium ${
                  isToday(day) ? 'bg-primary text-primary-foreground rounded-lg' : ''
                }`}
              >
                <div className="text-sm">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div className="mt-4">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_1fr] gap-2 border-t">
              <div className="text-sm text-muted-foreground py-4 text-right pr-2">
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
              <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} gap-2`}>
                {days.map((day) => {
                  const daySessions = sessions.filter((session) => {
                    const sessionDate = new Date(session.startTime);
                    const sessionHour = sessionDate.getHours();
                    return isSameDay(sessionDate, day) && sessionHour === hour;
                  });

                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="min-h-[60px] relative">
                      {daySessions.map((session) => (
                        <ClassSessionCard 
                          key={session.id}
                          session={session}
                          onClick={() => onSessionClick(session)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for month view
function MonthView({ 
  days, 
  sessions,
  onSessionClick 
}: { 
  days: Date[], 
  sessions: ClassSession[],
  onSessionClick: (session: ClassSession) => void
}) {
  const weeks = [];
  let currentWeek = [];
  
  // Add empty cells for days before month starts
  const firstDay = days[0].getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add empty cells for remaining days
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center font-medium text-muted-foreground p-2">
          {day}
        </div>
      ))}

      {/* Calendar cells */}
      {weeks.map((week, weekIndex) => (
        week.map((day, dayIndex) => {
          if (!day) {
            return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-[100px]"></div>;
          }

          const daySessions = sessions.filter((session) => 
            isSameDay(new Date(session.startTime), day)
          );

          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] p-2 border rounded-lg ${
                isToday(day) ? 'bg-primary/10 border-primary' : 'bg-background'
              }`}
            >
              <div className="font-medium text-sm mb-1">{format(day, 'd')}</div>
              <ScrollArea className="h-[70px]">
                <div className="space-y-1">
                  {daySessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="text-xs p-1 bg-primary/20 rounded cursor-pointer hover:bg-primary/30"
                      onClick={() => onSessionClick(session)}
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(session.startTime), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{daySessions.length - 3} more
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })
      ))}
    </div>
  );
}

// Class session card component
function ClassSessionCard({ 
  session, 
  onClick 
}: { 
  session: ClassSession,
  onClick: () => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in-progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <Video className="h-3 w-3" />;
      case 'in-person': return <MapPin className="h-3 w-3" />;
      case 'hybrid': return <Globe className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div 
      className={`absolute inset-0 p-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(session.status)}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-xs font-medium truncate flex-1">{session.title}</h4>
        {getTypeIcon(session.type)}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs">
          <User className="h-3 w-3" />
          <span className="truncate">{session.teacherName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(session.startTime), 'h:mm a')}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Badge variant="secondary" className="text-xs py-0">
            {session.level}
          </Badge>
          <span>{session.enrolledStudents}/{session.maxStudents}</span>
        </div>
      </div>
    </div>
  );
}

// Form component for creating/editing classes
function ClassScheduleForm({ 
  teachers, 
  rooms, 
  onSubmit,
  isPending,
  initialData = null
}: any) {
  const { t } = useTranslation();
  // Fetch available courses
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/admin/courses'],
  });

  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || '',
    teacherId: initialData?.teacherId || '',
    roomId: initialData?.roomId || '',
    startDate: initialData?.startDate || '',
    startTime: initialData?.startTime || '',
    duration: initialData?.duration || '60',
    maxStudents: initialData?.maxStudents || '20',
    type: initialData?.type || 'online',
    sessionNote: initialData?.sessionNote || '', // Note specific to this session
    isRecurring: initialData?.isRecurring || false,
    recurringPattern: initialData?.recurringPattern || 'weekly',
    recurringEnd: initialData?.recurringEnd || ''
  });

  // Get selected course details
  const selectedCourse = courses.find((c: any) => c.id === parseInt(formData.courseId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include course details in submission
    const submitData = {
      ...formData,
      title: selectedCourse?.title || '',
      level: selectedCourse?.level || '',
      language: selectedCourse?.language || ''
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="course">{t('classScheduling.course')}*</Label>
          <Select 
            value={formData.courseId} 
            onValueChange={(v) => setFormData({ ...formData, courseId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classScheduling.selectCourseToSchedule')} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title} - {course.level} ({course.language})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCourse && (
            <p className="text-sm text-muted-foreground">
              Duration: {selectedCourse.duration} weeks • Price: {selectedCourse.price?.toLocaleString()} IRR
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacher">{t('classScheduling.availableTeachers')}</Label>
          <Select 
            value={formData.teacherId} 
            onValueChange={(v) => setFormData({ ...formData, teacherId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classScheduling.selectAvailableTeacher')} />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher: Teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.name} {teacher.availabilityPeriods && teacher.availabilityPeriods.length > 0 && 
                    `(${teacher.availabilityPeriods.length} availability periods)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.teacherId && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              ✓ Teacher has availability periods matching the selected schedule
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="room">{t('classScheduling.room')}</Label>
          <Select 
            value={formData.roomId} 
            onValueChange={(v) => setFormData({ ...formData, roomId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classScheduling.selectRoom')} />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room: ClassRoom) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.capacity} capacity)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">{t('classScheduling.classType')}</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">{t('classScheduling.online')}</SelectItem>
              <SelectItem value="in-person">{t('classScheduling.inPerson')}</SelectItem>
              <SelectItem value="hybrid">{t('classScheduling.hybrid')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">{t('classScheduling.date')}</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">{t('classScheduling.time')}</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">{t('classScheduling.durationMinutes')}</Label>
          <Select 
            value={formData.duration} 
            onValueChange={(v) => setFormData({ ...formData, duration: v })}
          >
            <SelectTrigger>
              <SelectValue />
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

        <div className="space-y-2">
          <Label htmlFor="maxStudents">{t('classScheduling.maxStudents')}</Label>
          <Input
            id="maxStudents"
            type="number"
            value={formData.maxStudents}
            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
            min="1"
            max="50"
            required
          />
        </div>

      </div>

      <div className="space-y-2">
        <Label htmlFor="sessionNote">{t('classScheduling.sessionNote')}</Label>
        <Textarea
          id="sessionNote"
          value={formData.sessionNote}
          onChange={(e) => setFormData({ ...formData, sessionNote: e.target.value })}
          placeholder={t('placeholders.sessionNotes')}
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={formData.isRecurring}
          onCheckedChange={(v) => setFormData({ ...formData, isRecurring: v })}
        />
        <Label htmlFor="recurring">Recurring Class</Label>
      </div>

      {formData.isRecurring && (
        <div className="grid grid-cols-2 gap-4 pl-8">
          <div className="space-y-2">
            <Label htmlFor="recurringPattern">Repeat</Label>
            <Select 
              value={formData.recurringPattern} 
              onValueChange={(v) => setFormData({ ...formData, recurringPattern: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurringEnd">End Date</Label>
            <Input
              id="recurringEnd"
              type="date"
              value={formData.recurringEnd}
              onChange={(e) => setFormData({ ...formData, recurringEnd: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Scheduling...' : 'Schedule Class'}
        </Button>
      </div>
    </form>
  );
}