import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MessageSquare, 
  Users, 
  Calendar,
  Clock,
  Settings,
  Camera,
  Hand,
  Share,
  Download,
  Upload,
  Whiteboard,
  RecordingIcon,
  PhoneOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  UserPlus,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/use-language";

interface ClassroomSession {
  id: number;
  title: string;
  teacherName: string;
  scheduledFor: string;
  duration: number;
  currentParticipants: number;
  maxParticipants: number;
  status: 'scheduled' | 'live' | 'completed';
  features: string[];
  description?: string;
}

interface ActiveClassroom {
  id: number;
  title: string;
  teacher: string;
  participants: Array<{
    id: number;
    name: string;
    avatar: string;
    role: string;
    isMuted: boolean;
    isVideoOn: boolean;
    isHandRaised: boolean;
  }>;
  features: {
    screenShare: boolean;
    whiteboard: boolean;
    breakoutRooms: boolean;
    recording: boolean;
    chat: boolean;
    fileSharing: boolean;
  };
  messages: Array<{
    id: number;
    sender: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'file' | 'system';
  }>;
}

export default function LiveClassroom() {
  const [selectedSession, setSelectedSession] = useState<ClassroomSession | null>(null);
  const [activeClassroom, setActiveClassroom] = useState<ActiveClassroom | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isInClass, setIsInClass] = useState(false);
  
  // Classroom controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Form states
  const [newClassroom, setNewClassroom] = useState({
    title: "",
    description: "",
    scheduledFor: "",
    duration: 60,
    maxParticipants: 30,
    features: {
      screenShare: true,
      whiteboard: true,
      breakoutRooms: false,
      recording: true,
      chat: true,
      fileSharing: true
    }
  });
  
  const [chatMessage, setChatMessage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage, isRTL } = useLanguage();

  // Fetch classroom sessions
  const { data: sessions, isLoading } = useQuery<ClassroomSession[]>({
    queryKey: ['/api/classroom/sessions'],
  });

  // Create classroom mutation
  const createClassroom = useMutation({
    mutationFn: async (data: typeof newClassroom) => {
      return apiRequest('/api/classroom/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classroom/sessions'] });
      setCreateDialogOpen(false);
      setNewClassroom({
        title: "",
        description: "",
        scheduledFor: "",
        duration: 60,
        maxParticipants: 30,
        features: {
          screenShare: true,
          whiteboard: true,
          breakoutRooms: false,
          recording: true,
          chat: true,
          fileSharing: true
        }
      });
      toast({
        title: "کلاس ایجاد شد! / Classroom Created!",
        description: "کلاس مجازی شما با موفقیت ایجاد شد / Your virtual classroom has been created successfully",
      });
    },
  });

  // Join classroom mutation
  const joinClassroom = useMutation({
    mutationFn: async (classroomId: number) => {
      return apiRequest(`/api/classroom/${classroomId}/join`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      // Mock classroom data for demonstration
      const mockClassroom: ActiveClassroom = {
        id: selectedSession?.id || 1,
        title: selectedSession?.title || "Persian Grammar Fundamentals",
        teacher: selectedSession?.teacherName || "Dr. Maryam Hosseini",
        participants: [
          {
            id: 1,
            name: "Dr. Maryam Hosseini",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=100",
            role: "teacher",
            isMuted: false,
            isVideoOn: true,
            isHandRaised: false
          },
          {
            id: 2,
            name: "احمد محمدی",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
            role: "student",
            isMuted: true,
            isVideoOn: true,
            isHandRaised: false
          },
          {
            id: 3,
            name: "سارا کریمی",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
            role: "student",
            isMuted: true,
            isVideoOn: false,
            isHandRaised: true
          }
        ],
        features: {
          screenShare: true,
          whiteboard: true,
          breakoutRooms: true,
          recording: true,
          chat: true,
          fileSharing: true
        },
        messages: [
          {
            id: 1,
            sender: "Dr. Maryam Hosseini",
            message: "به کلاس خوش آمدید / Welcome to the class!",
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            type: 'text'
          },
          {
            id: 2,
            sender: "احمد محمدی",
            message: "ممنون استاد / Thank you professor",
            timestamp: new Date(Date.now() - 3 * 60 * 1000),
            type: 'text'
          }
        ]
      };
      
      setActiveClassroom(mockClassroom);
      setIsInClass(true);
      toast({
        title: "به کلاس خوش آمدید! / Welcome to Class!",
        description: "شما با موفقیت وارد کلاس شدید / You have successfully joined the classroom",
      });
    },
  });

  const handleJoinClass = (session: ClassroomSession) => {
    setSelectedSession(session);
    joinClassroom.mutate(session.id);
  };

  const handleLeaveClass = () => {
    setIsInClass(false);
    setActiveClassroom(null);
    setSelectedSession(null);
    toast({
      title: "کلاس ترک شد / Left Classroom",
      description: "شما از کلاس خارج شدید / You have left the classroom",
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !activeClassroom) return;
    
    const newMessage = {
      id: Date.now(),
      sender: "شما / You",
      message: chatMessage,
      timestamp: new Date(),
      type: 'text' as const
    };
    
    setActiveClassroom({
      ...activeClassroom,
      messages: [...activeClassroom.messages, newMessage]
    });
    setChatMessage("");
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isInClass && activeClassroom) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Classroom Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold">{activeClassroom.title}</h1>
            <Badge variant="secondary">{activeClassroom.teacher}</Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <RecordingIcon className="h-3 w-3 mr-1" />
                Recording
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">{activeClassroom.participants.length} participants</span>
            <Button variant="destructive" size="sm" onClick={handleLeaveClass}>
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-gray-800">
            {/* Teacher Video */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full max-w-4xl aspect-video bg-gray-700 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b547?w=800" 
                  alt="Teacher"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded">
                  {activeClassroom.teacher}
                </div>
                {isScreenSharing && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded">
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Screen Sharing
                  </div>
                )}
              </div>
            </div>

            {/* Student Videos Grid */}
            <div className="absolute bottom-4 right-4 grid grid-cols-2 gap-2">
              {activeClassroom.participants.filter(p => p.role === 'student').slice(0, 4).map((participant) => (
                <div key={participant.id} className="relative w-32 h-24 bg-gray-700 rounded overflow-hidden">
                  {participant.isVideoOn ? (
                    <img 
                      src={participant.avatar} 
                      alt={participant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-600">
                      <VideoOff className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black/70 px-1 rounded">
                    {participant.name.split(' ')[0]}
                  </div>
                  {participant.isMuted && (
                    <div className="absolute top-1 right-1">
                      <MicOff className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                  {participant.isHandRaised && (
                    <div className="absolute top-1 left-1">
                      <Hand className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 rounded-full px-6 py-3 flex items-center space-x-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isVideoOn ? "outline" : "destructive"}
                size="sm"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="rounded-full"
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="rounded-full"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              
              <Button
                variant={isHandRaised ? "default" : "outline"}
                size="sm"
                onClick={() => setIsHandRaised(!isHandRaised)}
                className="rounded-full"
              >
                <Hand className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Whiteboard className="h-4 w-4" />
              </Button>
              
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                className="rounded-full"
              >
                <RecordingIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white dark:bg-gray-900 border-l">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeClassroom.messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{message.sender}</span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="پیام خود را بنویسید / Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSendMessage}>
                      Send
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="participants" className="flex-1 p-4">
                <div className="space-y-3">
                  {activeClassroom.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>{participant.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{participant.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.isHandRaised && (
                          <Hand className="h-4 w-4 text-yellow-500" />
                        )}
                        {participant.isMuted ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-green-500" />
                        )}
                        {participant.isVideoOn ? (
                          <Video className="h-4 w-4 text-green-500" />
                        ) : (
                          <VideoOff className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton 
                href="/dashboard" 
                label={currentLanguage === 'fa' ? 'بازگشت' :
                       currentLanguage === 'ar' ? 'رجوع' :
                       'Back'}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentLanguage === 'fa' ? 'کلاس‌های زنده' :
                   currentLanguage === 'ar' ? 'الفصول المباشرة' :
                   'Live Classrooms'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentLanguage === 'fa' ? 'در کلاس‌های تعاملی شرکت کنید' :
                   currentLanguage === 'ar' ? 'انضم إلى الفصول التفاعلية المباشرة' :
                   'Join interactive live classes'}
                </p>
              </div>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Video className="h-4 w-4 mr-2" />
                  ایجاد کلاس / Create Class
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>ایجاد کلاس مجازی جدید / Create New Virtual Classroom</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">عنوان کلاس / Class Title</label>
                      <Input
                        value={newClassroom.title}
                        onChange={(e) => setNewClassroom({...newClassroom, title: e.target.value})}
                        placeholder="مثال: دستور زبان فارسی پایه"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">زمان شروع / Start Time</label>
                      <Input
                        type="datetime-local"
                        value={newClassroom.scheduledFor}
                        onChange={(e) => setNewClassroom({...newClassroom, scheduledFor: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">توضیحات / Description</label>
                    <Textarea
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom({...newClassroom, description: e.target.value})}
                      placeholder="توضیح کوتاه درباره محتوای کلاس..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">مدت زمان (دقیقه) / Duration (min)</label>
                      <Input
                        type="number"
                        value={newClassroom.duration}
                        onChange={(e) => setNewClassroom({...newClassroom, duration: parseInt(e.target.value)})}
                        min="30"
                        max="180"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">حداکثر شرکت‌کننده / Max Participants</label>
                      <Input
                        type="number"
                        value={newClassroom.maxParticipants}
                        onChange={(e) => setNewClassroom({...newClassroom, maxParticipants: parseInt(e.target.value)})}
                        min="5"
                        max="100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">ویژگی‌های کلاس / Class Features</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(newClassroom.features).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => 
                              setNewClassroom({
                                ...newClassroom, 
                                features: {...newClassroom.features, [key]: checked}
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => createClassroom.mutate(newClassroom)}
                    disabled={createClassroom.isPending}
                    className="w-full"
                  >
                    {createClassroom.isPending ? "در حال ایجاد... / Creating..." : "ایجاد کلاس / Create Class"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading classroom sessions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions?.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {session.teacherName}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        session.status === 'live' ? 'destructive' : 
                        session.status === 'scheduled' ? 'default' : 'secondary'
                      }
                    >
                      {session.status === 'live' ? 'زنده / Live' : 
                       session.status === 'scheduled' ? 'برنامه‌ریزی شده / Scheduled' : 'تمام شده / Completed'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDateTime(session.scheduledFor)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatTime(session.duration)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{session.currentParticipants}/{session.maxParticipants}</span>
                    </div>
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{session.features.length} features</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {session.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="pt-2">
                    {session.status === 'live' && (
                      <Button 
                        onClick={() => handleJoinClass(session)}
                        className="w-full"
                        disabled={joinClassroom.isPending}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {joinClassroom.isPending ? "در حال اتصال... / Joining..." : "ورود به کلاس / Join Class"}
                      </Button>
                    )}
                    {session.status === 'scheduled' && (
                      <Button variant="outline" className="w-full" disabled>
                        <Calendar className="h-4 w-4 mr-2" />
                        برنامه‌ریزی شده / Scheduled
                      </Button>
                    )}
                    {session.status === 'completed' && (
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        مشاهده ضبط / View Recording
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {sessions?.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              کلاسی یافت نشد / No Classes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              کلاس جدیدی ایجاد کنید یا منتظر کلاس‌های آینده باشید / Create a new class or wait for upcoming sessions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}