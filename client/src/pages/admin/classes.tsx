import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  courseId: number;
  courseName?: string;
  teacherId: number;
  teacherName?: string;
  roomId: number | null;
  roomName?: string;
  startDate: string;
  endDate: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  maxStudents: number;
  currentEnrollment: number;
  deliveryMode: 'online' | 'in_person' | 'hybrid';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Teacher {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  specializations: string[];
  availability: any[];
  availabilityPeriods?: any[];
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

  // Fetch all scheduled classes from the classes table
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/admin/classes'],
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['/api/admin/rooms'],
  });

  // Fetch courses for class creation
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/admin/courses'],
  });

  // Create new class
  const createSession = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classScheduled') });
      setIsCreateDialogOpen(false);
    }
  });

  // Update class
  const updateSession = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classUpdated') });
    }
  });

  // Delete class
  const deleteSession = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/classes/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.classDeleted') });
    }
  });

  // Filter sessions based on selected filters
  const filteredSessions = (sessions as ClassSession[] || []).filter((session: ClassSession) => {
    if (filters.teacher && filters.teacher !== 'all' && session.teacherId !== parseInt(filters.teacher)) return false;
    if (filters.room && filters.room !== 'all' && session.roomId !== parseInt(filters.room)) return false;
    if (filters.type && filters.type !== 'all' && session.deliveryMode !== filters.type) return false;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile First */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {t('admin:classes.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {t('admin:classes.subtitle')}
          </p>
        </div>

        {/* Toolbar - Mobile First */}
        <Card className="mb-4 sm:mb-6 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
              {/* View Controls - Mobile First */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={navigatePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={navigateNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setSelectedDate(new Date())}>
                    {t('admin:common.today')}
                  </Button>
                </div>
                
                <h2 className="text-lg font-semibold">
                  {viewMode === 'day' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d, yyyy')}`}
                  {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                </h2>
              </div>

              {/* View Mode Tabs - Mobile First */}
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                  <TabsTrigger value="day" className="text-xs sm:text-sm">{t('admin:common.day')}</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs sm:text-sm">{t('admin:common.week')}</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs sm:text-sm">{t('admin:common.month')}</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Actions - Mobile First */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2 h-8 text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{t('admin:classScheduling.scheduleClass')}</span>
                      <span className="sm:hidden">{t('admin:add')}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>{t('classScheduling.scheduleNewClass')}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
                      <ClassScheduleForm 
                        teachers={teachers}
                        rooms={rooms}
                        onSubmit={(data) => createSession.mutate(data)}
                        isPending={createSession.isPending}
                      />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" className="h-8 w-8">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Filters - Mobile First */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
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
                  <SelectValue placeholder={t('common:allLevels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common:allLevels')}</SelectItem>
                  <SelectItem value="beginner">{t('common:beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('common:intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('common:advanced')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('common:allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common:allTypes')}</SelectItem>
                  <SelectItem value="online">{t('admin:classes.online')}</SelectItem>
                  <SelectItem value="in-person">{t('admin:classes.inPerson')}</SelectItem>
                  <SelectItem value="hybrid">{t('admin:classes.hybrid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Classes List View */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin:classes.classList')}</CardTitle>
            <CardDescription>{t('admin:classes.classListDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {sessionsLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading classes...</p>
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No classes found</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Class
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((classSession: ClassSession) => (
                  <div key={classSession.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {classSession.courseName || `Course ${classSession.courseId}`}
                          </h3>
                          <Badge variant={classSession.status === 'scheduled' ? 'default' : 'secondary'}>
                            {classSession.status}
                          </Badge>
                          <Badge variant={classSession.deliveryMode === 'online' ? 'outline' : 'default'}>
                            {classSession.deliveryMode.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Teacher:</span>
                              <span className="font-medium">{classSession.teacherName || `Teacher ${classSession.teacherId}`}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Room:</span>
                              <span className="font-medium">{classSession.roomName || (classSession.roomId ? `Room ${classSession.roomId}` : 'Online')}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium">{classSession.startTime} - {classSession.endTime}</span>
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{classSession.startDate} to {classSession.endDate}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Repeat className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Schedule:</span>
                              <span className="font-medium">{classSession.weekdays?.join(', ') || 'Not set'}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Enrollment:</span>
                              <span className={`font-medium ${classSession.currentEnrollment >= classSession.maxStudents ? 'text-red-600' : 'text-green-600'}`}>
                                {classSession.currentEnrollment} / {classSession.maxStudents} students
                              </span>
                            </p>
                          </div>
                        </div>
                        
                        {classSession.notes && (
                          <p className="text-sm text-gray-600 mt-2">{classSession.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSession(classSession)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Manage Enrollment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Handle edit
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this class?')) {
                              deleteSession.mutate(classSession.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Details Dialog */}
        {selectedSession && (
          <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedSession.courseName || `Course ${selectedSession.courseId}`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Teacher</Label>
                    <p className="font-medium">{selectedSession.teacherName || `Teacher ${selectedSession.teacherId}`}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Room</Label>
                    <p className="font-medium">{selectedSession.roomName || (selectedSession.roomId ? `Room ${selectedSession.roomId}` : 'Online')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Time</Label>
                    <p className="font-medium">
                      {selectedSession.startTime} - {selectedSession.endTime}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Students</Label>
                    <p className="font-medium">
                      {selectedSession.currentEnrollment} / {selectedSession.maxStudents}
                    </p>
                  </div>
                </div>
                {selectedSession.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1">{selectedSession.notes}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
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
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
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
                      <div className="font-medium truncate">{session.courseName || `Course ${session.courseId}`}</div>
                      <div className="text-muted-foreground">
                        {session.startTime}
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
      case 'in_person': return <MapPin className="h-3 w-3" />;
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
        <h4 className="text-xs font-medium truncate flex-1">{session.courseName || `Course ${session.courseId}`}</h4>
        {getTypeIcon(session.deliveryMode)}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs">
          <User className="h-3 w-3" />
          <span className="truncate">{session.teacherName || `Teacher ${session.teacherId}`}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          <span>{session.startTime}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Badge variant="secondary" className="text-xs py-0">
            {session.status}
          </Badge>
          <span>{session.currentEnrollment}/{session.maxStudents}</span>
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
    classroomNumber: initialData?.classroomNumber || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    startTime: initialData?.startTime || '',
    duration: initialData?.duration || '60',
    maxStudents: initialData?.maxStudents || '20',
    type: initialData?.type || 'online',
    sessionNote: initialData?.sessionNote || '', // Note specific to this session
    weekDays: initialData?.weekDays || {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false
    }
  });

  // Get selected course details
  const selectedCourse = (courses as any[]).find((c: any) => c.id === parseInt(formData.courseId));

  // Calculate end date when start date changes (based on course duration)
  useEffect(() => {
    if (formData.startDate && selectedCourse?.duration) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (selectedCourse.duration * 7)); // duration is in weeks
      setFormData(prev => ({ 
        ...prev, 
        endDate: endDate.toISOString().split('T')[0] 
      }));
    }
  }, [formData.startDate, selectedCourse?.duration]);

  const handleWeekDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      weekDays: {
        ...prev.weekDays,
        [day]: !prev.weekDays[day]
      }
    }));
  };

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
              {(courses as any[]).map((course: any) => (
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

        {/* Show classroom field only for in-person type */}
        {formData.type === 'in-person' && (
          <div className="space-y-2">
            <Label htmlFor="classroomNumber">{t('classScheduling.classroomNumber')}*</Label>
            <Input
              id="classroomNumber"
              type="text"
              value={formData.classroomNumber}
              onChange={(e) => setFormData({ ...formData, classroomNumber: e.target.value })}
              placeholder={t('classScheduling.enterClassroomNumber')}
              required={formData.type === 'in-person'}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="startDate">{t('classScheduling.startDate')}</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">{t('classScheduling.endDate')}</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            disabled
            className="bg-muted"
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

      {/* Class Days Selection */}
      <div className="space-y-2 col-span-2">
        <Label>{t('classScheduling.classDays')}</Label>
        <div className="grid grid-cols-7 gap-2">
          {[
            { key: 'saturday', label: t('days.saturday') || 'شنبه' },
            { key: 'sunday', label: t('days.sunday') || 'یکشنبه' },
            { key: 'monday', label: t('days.monday') || 'دوشنبه' },
            { key: 'tuesday', label: t('days.tuesday') || 'سه‌شنبه' },
            { key: 'wednesday', label: t('days.wednesday') || 'چهارشنبه' },
            { key: 'thursday', label: t('days.thursday') || 'پنج‌شنبه' },
            { key: 'friday', label: t('days.friday') || 'جمعه' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={formData.weekDays[key]}
                onCheckedChange={() => handleWeekDayToggle(key)}
              />
              <Label 
                htmlFor={key} 
                className="text-sm cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('classScheduling.creating') : t('classScheduling.scheduleClass')}
        </Button>
      </div>
    </form>
  );
}