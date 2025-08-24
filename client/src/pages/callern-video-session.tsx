import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, Clock, User, Calendar, FileText, 
  Download, PlayCircle, MessageSquare, Award,
  Brain, Activity, TrendingUp, Monitor, ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { VideoCall } from "@/components/callern/VideoCall";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export default function CallernVideoSession() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams() as { roomId?: string };
  const { user } = useAuth();
  const { t } = useTranslation(['callern', 'common']);
  
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("teachers");
  
  // Fetch online teachers
  const { data: onlineTeachers, isLoading: teachersLoading, refetch: refetchTeachers } = useQuery({
    queryKey: ['/api/callern/online-teachers'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch student's Callern packages
  const { data: myPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/student/my-callern-packages']
  });

  // Fetch call history
  const { data: callHistory, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/callern/history/${user?.id}`]
  });

  // Auto-refresh online teachers
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTeachers();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchTeachers]);

  // Calculate available minutes
  const availableMinutes = myPackages?.reduce((total: number, pkg: any) => {
    if (pkg.status === 'active') {
      return total + (pkg.minutesRemaining || 0);
    }
    return total;
  }, 0) || 0;

  const handleStartCall = (teacher: any) => {
    if (availableMinutes <= 0) {
      toast({
        title: t('callern:noActivePackage'),
        description: t('callern:purchasePackageFirst'),
        variant: "destructive"
      });
      return;
    }

    // Generate room ID
    const roomId = `callern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setSelectedTeacher(teacher);
    setCallRoomId(roomId);
    setIsInCall(true);

    // Play notification sound for teacher
    const audio = new Audio('/sounds/call-start.mp3');
    audio.play().catch(() => {});
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallRoomId(null);
    setSelectedTeacher(null);
    
    toast({
      title: t('callern:callEnded'),
      description: t('callern:thankYouForSession')
    });

    // Refresh history and packages
    refetchTeachers();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isInCall && callRoomId) {
    return (
      <VideoCall
        roomId={callRoomId}
        userId={user?.id || 0}
        role="student"
        teacherName={`${selectedTeacher?.firstName} ${selectedTeacher?.lastName}`}
        onCallEnd={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common:back')}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t('callern:title')}
              </h1>
              <p className="text-muted-foreground mt-1">{t('callern:subtitle')}</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4">
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('callern:availableMinutes')}</p>
                      <p className="text-2xl font-bold text-purple-600">{availableMinutes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('callern:totalCalls')}</p>
                      <p className="text-2xl font-bold text-blue-600">{callHistory?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="teachers">{t('callern:teachers')}</TabsTrigger>
            <TabsTrigger value="packages">{t('callern:packages')}</TabsTrigger>
            <TabsTrigger value="history">{t('callern:history')}</TabsTrigger>
          </TabsList>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('callern:availableTeachers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teachersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">{t('callern:loadingTeachers')}</p>
                  </div>
                ) : onlineTeachers && onlineTeachers.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {onlineTeachers.map((teacher: any) => (
                      <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                                {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                              </div>
                              <div>
                                <h3 className="font-semibold">{teacher.firstName} {teacher.lastName}</h3>
                                <Badge variant="outline" className="mt-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                  {t('callern:online')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span>{teacher.languages?.join(', ') || 'English, Persian'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Award className="w-4 h-4" />
                              <span>{teacher.specializations?.join(', ') || 'General, Business'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-semibold">{teacher.hourlyRate || 500000} IRR {t('callern:perHour')}</span>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            onClick={() => handleStartCall(teacher)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {t('callern:startVideoCall')}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('callern:noTeachersAvailable', { language: 'your selected' })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('callern:myPackages')}</CardTitle>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : myPackages && myPackages.length > 0 ? (
                  <div className="space-y-3">
                    {myPackages.map((pkg: any) => (
                      <Card key={pkg.id} className={pkg.status === 'active' ? 'border-green-500' : 'border-gray-300'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{pkg.packageName}</h4>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{pkg.minutesRemaining} / {pkg.totalMinutes} {t('callern:minutes')}</span>
                                <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                                  {t(`callern:${pkg.status}`)}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{t('callern:expiresOn')}</p>
                              <p className="font-semibold">{format(new Date(pkg.expiresAt), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('callern:noPackagesYet')}</p>
                    <Button className="mt-4" onClick={() => setLocation('/student/callern-packages')}>
                      {t('callern:browsePackages')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('callern:callHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : callHistory && callHistory.length > 0 ? (
                  <div className="space-y-3">
                    {callHistory.map((call: any) => (
                      <Card key={call.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white">
                                {call.teacherName?.[0] || 'T'}
                              </div>
                              <div>
                                <h4 className="font-semibold">{call.teacherName || t('callern:teacher')}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(call.startedAt), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                                {t(`callern:${call.status}`)}
                              </Badge>
                              <p className="text-sm font-semibold mt-1">
                                {formatDuration(call.duration)} {t('callern:duration')}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {call.recordingUrl && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(call.recordingUrl, '_blank')}>
                                    <PlayCircle className="w-3 h-3 mr-1" />
                                    {t('callern:viewRecording')}
                                  </Button>
                                )}
                                {call.transcriptUrl && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(call.transcriptUrl, '_blank')}>
                                    <FileText className="w-3 h-3 mr-1" />
                                    {t('callern:transcript')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* AI Metrics */}
                          {call.metrics && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                  <Activity className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                                  <p className="text-xs text-muted-foreground">{t('callern:engagement')}</p>
                                  <p className="font-semibold">{call.metrics.engagementScore}%</p>
                                </div>
                                <div>
                                  <Brain className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                                  <p className="text-xs text-muted-foreground">{t('callern:aiAssists')}</p>
                                  <p className="font-semibold">{call.metrics.aiAssists || 0}</p>
                                </div>
                                <div>
                                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
                                  <p className="text-xs text-muted-foreground">{t('callern:progress')}</p>
                                  <p className="font-semibold">{call.metrics.progressScore}%</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('callern:noCallsYet')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('callern:startFirstCall')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}