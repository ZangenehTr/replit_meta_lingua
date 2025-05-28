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

interface Mentor {
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
  pricePerMinute: number;
  successRate: number;
  description: string;
}

interface CallSession {
  id: number;
  mentorId: number;
  mentorName: string;
  mentorAvatar: string;
  startTime: Date;
  duration: number;
  status: 'active' | 'ended' | 'paused';
  cost: number;
  topic: string;
}

export default function OnDemandMentoring() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [callTopic, setCallTopic] = useState("");
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [userCredits, setUserCredits] = useState(2500); // در تومان

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available mentors
  const { data: mentors, isLoading } = useQuery<Mentor[]>({
    queryKey: ['/api/mentoring/available-mentors'],
  });

  // Fetch call history
  const { data: callHistory } = useQuery({
    queryKey: ['/api/mentoring/call-history'],
  });

  // Start call mutation
  const startCall = useMutation({
    mutationFn: async (data: { mentorId: number; topic: string; callType: 'voice' | 'video' }) => {
      return apiRequest('/api/mentoring/start-call', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setActiveCall(data.session);
      setIsCallDialogOpen(false);
      toast({
        title: "تماس برقرار شد! / Call Connected!",
        description: "تماس شما با مربی آغاز شد / Your call with the mentor has started",
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
    mutationFn: async (callId: number) => {
      return apiRequest(`/api/mentoring/end-call/${callId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setActiveCall(null);
      setCallTimer(0);
      queryClient.invalidateQueries({ queryKey: ['/api/mentoring/call-history'] });
      toast({
        title: "تماس پایان یافت / Call Ended",
        description: "تماس شما با موفقیت پایان یافت و هزینه محاسبه شد / Your call has ended successfully and cost has been calculated",
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

  const calculateEstimatedCost = (minutes: number) => {
    if (!selectedMentor) return 0;
    return minutes * selectedMentor.pricePerMinute;
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!selectedMentor) return;
    
    if (userCredits < selectedMentor.pricePerMinute * 5) {
      toast({
        title: "اعتبار ناکافی / Insufficient Credits",
        description: "برای شروع تماس حداقل ۵ دقیقه اعتبار نیاز دارید / You need at least 5 minutes of credit to start a call",
        variant: "destructive",
      });
      return;
    }

    startCall.mutate({
      mentorId: selectedMentor.id,
      topic: callTopic,
      callType: type,
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      endCall.mutate(activeCall.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading mentors...</p>
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
                  <AvatarImage src={activeCall.mentorAvatar} alt={activeCall.mentorName} />
                  <AvatarFallback>{activeCall.mentorName[0]}</AvatarFallback>
                </Avatar>
              </div>
              
              <div>
                <h3 className="text-xl font-bold">{activeCall.mentorName}</h3>
                <p className="text-gray-600 dark:text-gray-400">{activeCall.topic}</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-green-600">
                  {formatTime(callTimer)}
                </div>
                <p className="text-sm text-gray-500">
                  هزینه تقریبی: {formatTomanPrice(Math.ceil(callTimer / 60) * (selectedMentor?.pricePerMinute || 0))}
                </p>
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
                مربیگری آنی / On-Demand Mentoring
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                با مربیان آنلاین صحبت کنید / Talk to online mentors instantly
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span className="text-lg font-bold text-green-600">
                  {formatTomanPrice(userCredits)}
                </span>
              </div>
              <p className="text-sm text-gray-500">اعتبار شما / Your Credits</p>
              <Button variant="outline" size="sm" className="mt-2">
                شارژ اعتبار / Add Credits
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Mentors */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">مربیان آنلاین / Online Mentors</h2>
              <Badge variant="secondary">
                {mentors?.filter(m => m.isOnline).length || 0} مربی آنلاین
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {mentors?.filter(mentor => mentor.isOnline).map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={mentor.avatar} alt={mentor.name} />
                          <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{mentor.name}</h3>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatTomanPrice(mentor.pricePerMinute)}/دقیقه
                            </p>
                            <p className="text-xs text-gray-500">per minute</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{mentor.rating}</span>
                            <span className="text-sm text-gray-500">({mentor.reviewCount})</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm">{mentor.totalMinutes.toLocaleString()} دقیقه تجربه</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm">{mentor.successRate}% موفقیت</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {mentor.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {mentor.specializations.slice(0, 3).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {mentor.languages.slice(0, 2).map((lang, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Languages className="h-3 w-3 mr-1" />
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog open={isCallDialogOpen && selectedMentor?.id === mentor.id} onOpenChange={setIsCallDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                className="flex-1"
                                onClick={() => setSelectedMentor(mentor)}
                                disabled={!!activeCall}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                تماس صوتی / Voice Call
                              </Button>
                            </DialogTrigger>
                            
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>شروع تماس با {mentor.name} / Start Call with {mentor.name}</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={mentor.avatar} alt={mentor.name} />
                                    <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-bold">{mentor.name}</h3>
                                    <p className="text-sm text-gray-600">{mentor.responseTime}</p>
                                    <p className="text-lg font-bold text-green-600">
                                      {formatTomanPrice(mentor.pricePerMinute)}/دقیقه
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    موضوع صحبت / Call Topic
                                  </label>
                                  <Textarea
                                    placeholder="موضوع یا سؤالی که می‌خواهید در مورد آن صحبت کنید / Topic or question you want to discuss"
                                    value={callTopic}
                                    onChange={(e) => setCallTopic(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">برآورد هزینه / Cost Estimate</h4>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">۵ دقیقه</p>
                                      <p className="font-bold">{formatTomanPrice(calculateEstimatedCost(5))}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">۱۰ دقیقه</p>
                                      <p className="font-bold">{formatTomanPrice(calculateEstimatedCost(10))}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">۱۵ دقیقه</p>
                                      <p className="font-bold">{formatTomanPrice(calculateEstimatedCost(15))}</p>
                                    </div>
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
            {/* Call History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  تاریخچه تماس‌ها / Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callHistory?.slice(0, 5).map((call: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={call.mentorAvatar} />
                          <AvatarFallback>{call.mentorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{call.mentorName}</p>
                          <p className="text-xs text-gray-500">{call.duration} دقیقه</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-medium">{formatTomanPrice(call.cost)}</p>
                        <p className="text-gray-500">{call.date}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 text-center py-4">
                      هنوز تماسی برقرار نکرده‌اید / No calls yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>آمار شما / Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">کل تماس‌ها:</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">کل دقایق:</span>
                  <span className="font-medium">145 دقیقه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">میانگین تماس:</span>
                  <span className="font-medium">6.3 دقیقه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">رضایت شما:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium ml-1">4.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>نکات مفید / Helpful Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• موضوع صحبت خود را از قبل آماده کنید</p>
                  <p>• در محیط آرام صحبت کنید</p>
                  <p>• اعتبار کافی داشته باشید</p>
                  <p>• Prepare your topic in advance</p>
                  <p>• Find a quiet environment</p>
                  <p>• Ensure sufficient credits</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}