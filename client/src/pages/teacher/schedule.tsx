import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Video, MapPin, Plus, Edit, Trash2, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface ClassSession {
  id: number;
  title: string;
  courseTitle: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  maxStudents: number;
  type: 'online' | 'in-person';
  room?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function TeacherSchedulePage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isActive: true
  });

  // Only fetch assigned classes (not create sessions)
  const { data: classes = [], isLoading } = useQuery<ClassSession[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ["/api/teacher/availability"],
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData: any) => {
      const response = await fetch('/api/teacher/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(availabilityData)
      });
      if (!response.ok) {
        throw new Error('Failed to add availability');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/availability"] });
      setShowAddDialog(false);
      setNewAvailability({
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddAvailability = () => {
    if (!newAvailability.dayOfWeek || !newAvailability.startTime || !newAvailability.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    addAvailabilityMutation.mutate(newAvailability);
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });
  };

  const getSessionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return sessions.filter(session => session.date === dateString);
  };

  const weekDays = getWeekDays();

  if (isLoading || availabilityLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('teachingSchedule')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('manageScheduleAvailability')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              onClick={() => setViewMode('week')}
            >
              {t('week')}
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              onClick={() => setViewMode('month')}
            >
              {t('month')}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="ml-4">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addAvailability')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('addAvailability')}</DialogTitle>
                  <DialogDescription>
                    Add your teaching availability for students to book sessions.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dayOfWeek" className="text-right">
                      Day
                    </Label>
                    <Select value={newAvailability.dayOfWeek} onValueChange={(value) => 
                      setNewAvailability(prev => ({ ...prev, dayOfWeek: value }))
                    }>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startTime" className="text-right">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newAvailability.startTime}
                      onChange={(e) => setNewAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endTime" className="text-right">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newAvailability.endTime}
                      onChange={(e) => setNewAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleAddAvailability}
                    disabled={addAvailabilityMutation.isPending}
                  >
                    {addAvailabilityMutation.isPending ? 'Adding...' : 'Add Availability'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('thisWeek')}</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalHours')}</p>
                  <p className="text-2xl font-bold">32</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('students')}</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('availability')}</p>
                  <p className="text-2xl font-bold">{availability.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule View */}
        {viewMode === 'week' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('weeklySchedule')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prevWeek = new Date(selectedDate);
                      prevWeek.setDate(selectedDate.getDate() - 7);
                      setSelectedDate(prevWeek);
                    }}
                  >
                    ←
                  </Button>
                  <span className="text-sm font-normal">
                    {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextWeek = new Date(selectedDate);
                      nextWeek.setDate(selectedDate.getDate() + 7);
                      setSelectedDate(nextWeek);
                    }}
                  >
                    →
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const daySessions = getSessionsForDate(day);
                  const dayName = day.toLocaleDateString('en', { weekday: 'short' });
                  const dayNumber = day.getDate();
                  
                  return (
                    <div key={index} className="min-h-32 border rounded-lg p-2">
                      <div className="text-center mb-2">
                        <div className="text-xs text-gray-500">{dayName}</div>
                        <div className="text-lg font-semibold">{dayNumber}</div>
                      </div>
                      
                      <div className="space-y-1">
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-blue-100 dark:bg-blue-900 p-1 rounded text-xs"
                          >
                            <div className="font-medium truncate">{session.title}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {session.startTime}
                            </div>
                            <div className="flex items-center gap-1">
                              {session.type === 'online' ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <MapPin className="w-3 h-3" />
                              )}
                              <span>{session.students}/{session.maxStudents}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Sessions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('todaySessions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-16">
                      <div className="text-lg font-bold">{session.startTime}</div>
                      <div className="text-xs text-gray-500">{session.endTime}</div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-600">{session.courseTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {session.type === 'online' ? (
                          <Badge variant="secondary">
                            <Video className="w-3 h-3 mr-1" />
                            {t('online')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {session.room}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {session.students}/{session.maxStudents}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        session.status === 'completed' ? 'default' :
                        session.status === 'cancelled' ? 'destructive' : 'secondary'
                      }
                    >
                      {t(session.status)}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {t('noSessionsToday')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}