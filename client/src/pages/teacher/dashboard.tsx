import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, BookOpen, DollarSign, Clock, Star, MessageCircle, Video, FileText, ChevronRight, Play, PauseCircle, Settings, Eye, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation(['teacher', 'common']);
  const { language, isRTL, direction } = useLanguage();

  // Fetch teacher dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/teacher/dashboard-stats']
  });

  // Fetch teacher classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/teacher/classes']
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/teacher/sessions/upcoming']
  });

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/teacher/assignments']
  });

  // Fetch unacknowledged observations for notification badge
  const { data: unacknowledgedObservations } = useQuery({
    queryKey: ['/api/teacher/observations', 'unacknowledged']
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'in-person':
        return '🏢';
      case 'online':
        return '💻';
      case 'callern':
        return '📞';
      default:
        return '💻';
    }
  };

  const handleJoinClass = (classItem: any) => {
    if (classItem.deliveryMode === 'online') {
      // Open online classroom or video call
      window.open(classItem.sessionUrl || `https://meet.jit.si/class-${classItem.id}`, '_blank');
      toast({
        title: 'Joining Class',
        description: `Connecting to ${classItem.title}`
      });
    } else if (classItem.deliveryMode === 'callern') {
      // Initiate VoIP call
      toast({
        title: 'Initiating Call',
        description: 'Starting voice call with student'
      });
    } else {
      // In-person class
      toast({
        title: 'Class Location',
        description: `Room: ${classItem.roomName || 'TBA'}`
      });
    }
  };

  const handleClassChat = (classId: number) => {
    setLocation(`/teacher/class/${classId}/chat`);
  };

  const handleViewAssignment = (assignmentId: number) => {
    setLocation(`/teacher/assignments?view=${assignmentId}`);
  };

  const handleSetAvailability = () => {
    setLocation('/teacher/availability');
  };

  const handleViewSchedule = () => {
    setLocation('/teacher/schedule');
  };

  const handleViewObservations = () => {
    setLocation('/teacher/observations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('teacher:dashboard.title')}</h1>
              <p className="text-gray-600">{t('teacher:dashboard.welcomeMessage')}</p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900">{stats?.overview?.rating || 4.8}</span>
                <span className="text-gray-600">({stats?.overview?.totalReviews || 156} {t('teacher:reviews')})</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {t('teacher:activeTeacher')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('teacher:totalClasses')}</p>
                  <p className="text-3xl font-bold">{stats?.overview?.totalClasses || 0}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">{t('teacher:students')}</p>
                  <p className="text-3xl font-bold">{stats?.overview?.totalStudents || 0}</p>
                </div>
                <Users className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">{t('teacher:monthlyEarnings')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.overview?.monthlyEarnings || 0)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">{t('teacher:upcomingClasses')}</p>
                  <p className="text-3xl font-bold">{stats?.overview?.upcomingClasses || 0}</p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview">{t('teacher:overview')}</TabsTrigger>
            <TabsTrigger value="classes">{t('teacher:classes')}</TabsTrigger>
            <TabsTrigger value="assignments">{t('teacher:assignments')}</TabsTrigger>
            <TabsTrigger value="schedule">{t('teacher:schedule')}</TabsTrigger>
            <TabsTrigger value="availability">{t('teacher:availability')}</TabsTrigger>
            <TabsTrigger value="observations" className="relative">
              {t('teacher:observations')}
              {unacknowledgedObservations?.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {unacknowledgedObservations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions?.slice(0, 3).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getServiceIcon(session.type)}</div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-600">{session.studentName}</p>
                          <p className="text-sm text-blue-600">
                            {new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleJoinClass(session)}
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No classes scheduled for today</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentActivity?.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-600">with {activity.student}</p>
                        </div>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <p className="text-sm text-gray-600">Classes assigned to you by administrators</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes?.map((classItem: any) => (
                    <Card key={classItem.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-2xl mb-2">{getServiceIcon(classItem.type)}</div>
                          <Badge variant={classItem.status === 'scheduled' ? 'default' : 'secondary'}>
                            {classItem.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{classItem.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{classItem.course}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={classItem.studentAvatar} />
                            <AvatarFallback>{classItem.studentName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{classItem.studentName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{new Date(classItem.scheduledAt).toLocaleDateString()}</span>
                          <span>{classItem.duration} min</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleClassChat(classItem.id)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                          {classItem.type === 'online' && (
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleJoinClass(classItem)}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No classes assigned yet. Contact your administrator for class assignments.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Assignments</CardTitle>
                <p className="text-sm text-gray-600">Create and manage assignments for your students</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments?.map((assignment: any) => (
                    <Card key={assignment.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Student: {assignment.studentName}</span>
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                              <span>Course: {assignment.courseName}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              assignment.status === 'submitted' ? 'default' :
                              assignment.status === 'graded' ? 'secondary' : 'outline'
                            }>
                              {assignment.status}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewAssignment(assignment.id)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <p className="text-center py-8 text-gray-500">No assignments created yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <p className="text-sm text-gray-600">Your class schedule for this week</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions?.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getServiceIcon(session.type)}</div>
                        <div>
                          <h3 className="font-semibold">{session.title}</h3>
                          <p className="text-sm text-gray-600">{session.studentName}</p>
                          <p className="text-sm text-blue-600">
                            {new Date(session.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{session.duration} min</Badge>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinClass(session)}
                        >
                          {session.type === 'online' ? (
                            <>
                              <Video className="w-3 h-3 mr-1" />
                              Join
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center py-8 text-gray-500">No upcoming sessions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Availability</CardTitle>
                <p className="text-sm text-gray-600">Set your available time slots for administrators to assign classes</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Availability Management</h3>
                  <p className="text-gray-600 mb-4">
                    Teachers can only set monthly availability slots.<br />
                    Administrators will assign classes based on your availability.
                  </p>
                  <Button onClick={handleSetAvailability}>
                    <Settings className="w-4 h-4 mr-2" />
                    Set Monthly Availability
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observations Tab */}
          <TabsContent value="observations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Teaching Observations
                </CardTitle>
                <p className="text-sm text-gray-600">
                  View and respond to your classroom observation reports
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Observation Management</h3>
                  <p className="text-gray-600 mb-4">
                    Review feedback from supervisors about your teaching performance.<br />
                    Acknowledge observations and submit improvement plans when needed.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleViewObservations}>
                      <Eye className="w-4 h-4 mr-2" />
                      View All Observations
                    </Button>
                    {unacknowledgedObservations?.length > 0 && (
                      <Button variant="outline" className="border-red-200 text-red-700">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {unacknowledgedObservations.length} Unacknowledged
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}