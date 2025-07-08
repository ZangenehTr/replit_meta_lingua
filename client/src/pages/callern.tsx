import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Phone, 
  Video, 
  Clock, 
  Star, 
  Users, 
  MessageCircle,
  CreditCard,
  History,
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  UserCheck,
  Timer,
  Award,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Teacher {
  id: number;
  name: string;
  avatar: string;
  specializations: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  totalMinutes: number;
  isOnline: boolean;
  responseTime: string;
  hourlyRate: number;
  successRate: number;
  description: string;
}

interface CallSession {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherAvatar: string;
  startTime: Date;
  duration: number;
  status: 'active' | 'ended' | 'paused';
  packageId: number;
  topic: string;
}

interface SyllabusProgress {
  id: number;
  topicId: number;
  topicTitle: string;
  topicCategory: string;
  topicLevel: string;
  teacherId: number;
  teacherName: string;
  completedAt: Date;
  notes?: string;
}

interface StudentHistory {
  totalSessions: number;
  completedTopics: number;
  currentLevel: string;
  strengths: string[];
  weaknesses: string[];
  lastSession?: {
    date: Date;
    teacher: string;
    topics: string[];
  };
  notes: string;
}

export default function Callern() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showStudentHistory, setShowStudentHistory] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available online teachers
  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/callern/online-teachers'],
  });

  // Fetch student's syllabus progress
  const { data: syllabusProgress } = useQuery<SyllabusProgress[]>({
    queryKey: ['/api/callern/student-progress'],
  });

  // Fetch available syllabus topics
  const { data: syllabusTopics } = useQuery({
    queryKey: ['/api/callern/syllabus-topics'],
  });

  // Start call mutation
  const startCall = useMutation({
    mutationFn: async (data: { teacherId: number; packageId: number; callType: 'voice' | 'video' }) => {
      return apiRequest('/api/callern/start-call', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setActiveCall(data.session);
      setIsCallDialogOpen(false);
      toast({
        title: "تماس برقرار شد! / Call Connected!",
        description: "جلسه Callern شما با معلم آغاز شد / Your Callern session with the teacher has started",
      });
    },
    onError: () => {
      toast({
        title: "خطا / Error",
        description: "برقراری تماس با مشکل مواجه شد / Failed to connect call. Please try again.",
        variant: "destructive",
      });
    },
  });

  // End call mutation
  const endCall = useMutation({
    mutationFn: async (data: { callId: number; completedTopics: number[] }) => {
      return apiRequest(`/api/callern/end-call/${data.callId}`, {
        method: 'POST',
        body: JSON.stringify({ completedTopics: data.completedTopics }),
      });
    },
    onSuccess: () => {
      setActiveCall(null);
      setCallTimer(0);
      setSelectedTopics([]);
      queryClient.invalidateQueries({ queryKey: ['/api/callern/student-progress'] });
      toast({
        title: "جلسه پایان یافت / Session Ended",
        description: "موضوعات تکمیل شده ثبت شد / Completed topics have been recorded",
      });
    },
  });

  // Timer effect for active call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'active') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTomanPrice = (price: number) => {
    return `${price.toLocaleString('fa-IR')} تومان`;
  };

  // Get student's active package
  const { data: activePackage } = useQuery({
    queryKey: ['/api/callern/student-packages'],
  });

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!selectedTeacher || !activePackage) return;
    
    if (activePackage.remainingMinutes < 15) {
      toast({
        title: "ساعت ناکافی / Insufficient Hours",
        description: "حداقل ۱۵ دقیقه برای شروع جلسه نیاز دارید / You need at least 15 minutes to start a session",
        variant: "destructive",
      });
      return;
    }

    startCall.mutate({
      teacherId: selectedTeacher.id,
      packageId: activePackage.id,
      callType: type,
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      endCall.mutate({ 
        callId: activeCall.id,
        completedTopics: selectedTopics
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading Callern teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Active Call Interface */}
      {activeCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={activeCall.teacherAvatar} alt={activeCall.teacherName} />
                  <AvatarFallback>{activeCall.teacherName[0]}</AvatarFallback>
                </Avatar>
              </div>
              
              <div>
                <h3 className="text-xl font-bold">{activeCall.teacherName}</h3>
                <p className="text-gray-600 dark:text-gray-400">Callern Session</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-green-600">
                  {formatTime(callTimer)}
                </div>
                <p className="text-sm text-gray-500">
                  از بسته {activePackage?.packageName || ''} استفاده می‌شود
                </p>
              </div>
              
              {/* Syllabus Topics Selection */}
              <div className="text-left">
                <h4 className="font-medium mb-2">موضوعات تدریس شده / Topics Covered:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {syllabusTopics?.map((topic: any) => (
                    <label key={topic.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTopics([...selectedTopics, topic.id]);
                          } else {
                            setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{topic.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full w-14 h-14"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleEndCall}
                  className="rounded-full w-14 h-14"
                  disabled={endCall.isPending}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                
                <Button
                  variant={isVideoEnabled ? "outline" : "destructive"}
                  size="lg"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className="rounded-full w-14 h-14"
                >
                  <Video className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Callern - یادگیری با تماس ویدیویی
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                با معلمان آنلاین در ساعات دلخواه صحبت کنید / Learn with online teachers at flexible hours
              </p>
            </div>
            
            <div className="text-right">
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">بسته فعال / Active Package</p>
                {activePackage ? (
                  <div>
                    <p className="font-bold text-lg">{activePackage.packageName}</p>
                    <p className="text-sm text-gray-600">
                      {Math.floor(activePackage.remainingMinutes / 60)} ساعت و {activePackage.remainingMinutes % 60} دقیقه باقیمانده
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">بسته‌ای خریداری نشده</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Teachers */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">معلمان آنلاین / Online Teachers</h2>
              <Badge variant="secondary">
                {teachers?.filter(t => t.isOnline).length || 0} معلم آنلاین
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {teachers?.filter(teacher => teacher.isOnline).map((teacher) => (
                <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={teacher.avatar} alt={teacher.name} />
                          <AvatarFallback>{teacher.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{teacher.name}</h3>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {formatTomanPrice(teacher.hourlyRate)}/ساعت
                            </p>
                            <p className="text-xs text-gray-500">per hour</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{teacher.rating}</span>
                            <span className="text-sm text-gray-500">({teacher.reviewCount})</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm">{Math.floor(teacher.totalMinutes / 60)} ساعت تدریس</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm">{teacher.successRate}% رضایت</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {teacher.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {teacher.specializations.slice(0, 3).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {teacher.languages.slice(0, 2).map((lang, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Languages className="h-3 w-3 mr-1" />
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog open={isCallDialogOpen && selectedTeacher?.id === teacher.id} onOpenChange={setIsCallDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                className="flex-1"
                                onClick={() => {
                                  setSelectedTeacher(teacher);
                                  setShowStudentHistory(true);
                                }}
                                disabled={!!activeCall || !activePackage}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                شروع جلسه / Start Session
                              </Button>
                            </DialogTrigger>
                            
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>جلسه با {teacher.name} / Session with {teacher.name}</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                {/* Student History for Teacher */}
                                {showStudentHistory && (
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <History className="h-4 w-4 mr-2" />
                                      تاریخچه دانش‌آموز / Student History
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>سطح فعلی:</strong> B1 - Intermediate</p>
                                      <p><strong>تعداد جلسات:</strong> 15 جلسه</p>
                                      <p><strong>نقاط قوت:</strong> Vocabulary, Listening</p>
                                      <p><strong>نیازمند تقویت:</strong> Speaking fluency, Grammar</p>
                                      <p><strong>آخرین جلسه:</strong> 3 روز پیش - موضوع: Business Conversations</p>
                                      <p><strong>یادداشت معلم قبلی:</strong> "Student shows good progress in vocabulary but needs more practice with complex grammar structures."</p>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={teacher.avatar} alt={teacher.name} />
                                    <AvatarFallback>{teacher.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-bold">{teacher.name}</h3>
                                    <p className="text-sm text-gray-600">{teacher.responseTime}</p>
                                    <p className="text-lg font-bold text-primary">
                                      {formatTomanPrice(teacher.hourlyRate)}/ساعت
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="bg-primary/10 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">بسته فعال شما / Your Active Package</h4>
                                  <div className="space-y-2">
                                    <p className="font-bold">{activePackage?.packageName}</p>
                                    <div className="flex items-center justify-between">
                                      <span>زمان باقیمانده:</span>
                                      <span className="font-bold">
                                        {Math.floor(activePackage?.remainingMinutes / 60)}h {activePackage?.remainingMinutes % 60}m
                                      </span>
                                    </div>
                                    <Progress 
                                      value={(activePackage?.usedMinutes / (activePackage?.totalHours * 60)) * 100} 
                                      className="h-2"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => handleStartCall('voice')}
                                    disabled={startCall.isPending}
                                    className="flex-1"
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    تماس صوتی / Voice Call
                                  </Button>
                                  <Button 
                                    onClick={() => handleStartCall('video')}
                                    disabled={startCall.isPending}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    تماس تصویری / Video Call
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Syllabus Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  پیشرفت درسی / Syllabus Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syllabusProgress?.slice(0, 5).map((progress: SyllabusProgress) => (
                    <div key={progress.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{progress.topicTitle}</p>
                        <Badge variant="secondary" className="text-xs">
                          {progress.topicLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{progress.topicCategory}</span>
                        <span>•</span>
                        <span>{new Date(progress.completedAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        با {progress.teacherName}
                      </p>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 text-center py-4">
                      هنوز موضوعی تکمیل نشده / No topics completed yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Callern Stats */}
            <Card>
              <CardHeader>
                <CardTitle>آمار Callern / Callern Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">جلسات کل:</span>
                  <span className="font-medium">12 جلسه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ساعات یادگیری:</span>
                  <span className="font-medium">18 ساعت</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">موضوعات تکمیل شده:</span>
                  <span className="font-medium">27 موضوع</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">سطح فعلی:</span>
                  <span className="font-medium text-primary">B1 - Intermediate</span>
                </div>
              </CardContent>
            </Card>

            {/* Callern Tips */}
            <Card>
              <CardHeader>
                <CardTitle>نکات Callern / Callern Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• حداقل ۱۵ دقیقه برای هر جلسه وقت بگذارید</p>
                  <p>• معلم بر اساس سابقه شما تدریس می‌کند</p>
                  <p>• موضوعات درسی به صورت خودکار ثبت می‌شود</p>
                  <p>• Allow at least 15 minutes per session</p>
                  <p>• Teachers adapt based on your history</p>
                  <p>• Syllabus topics are tracked automatically</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}