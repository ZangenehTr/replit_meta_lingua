import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VideoCall } from "@/components/callern/video-call";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileCard } from "@/components/mobile/MobileCard";
import io, { Socket } from 'socket.io-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Layout is imported as MobileLayout above
import { 
  Video, 
  Clock, 
  Package, 
  Phone, 
  Calendar, 
  User, 
  Star,
  CheckCircle,
  XCircle,
  PlayCircle,
  Globe,
  Zap,
  ShoppingCart,
  History,
  Users,
  ChevronRight,
  Wifi,
  WifiOff,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallernPackage {
  id: number;
  packageName: string;
  totalHours: number;
  price: number;
  description: string;
  isActive: boolean;
}

interface StudentCallernPackage {
  id: number;
  packageId: number;
  totalHours: number;
  usedMinutes: number;
  remainingMinutes: number;
  price: number;
  status: string;
  purchasedAt: string;
  expiresAt?: string;
  package: CallernPackage;
}

interface CallHistory {
  id: number;
  teacherId: number;
  duration: number;
  callType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  teacherName: string;
  recordingUrl?: string;
}

interface AvailableTeacher {
  id: number;
  firstName: string;
  lastName: string;
  languages: string[];
  specializations: string[];
  rating: number;
  hourlyRate: number;
  isOnline: boolean;
  profileImageUrl?: string;
}

export default function CallernSystem() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation(['callern', 'common']);
  const [selectedPackage, setSelectedPackage] = useState<CallernPackage | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<AvailableTeacher | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [activeCallConfig, setActiveCallConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'teachers' | 'history'>('teachers');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [waitingForTeacher, setWaitingForTeacher] = useState(false);

  // Fetch available Callern packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/student/callern-packages"],
  });

  // Fetch student's purchased packages
  const { data: studentPackages = [], isLoading: studentPackagesLoading } = useQuery({
    queryKey: ["/api/student/my-callern-packages"],
  });

  // Fetch call history
  const { data: callHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/student/callern-history"],
  });

  // Fetch available teachers - FORCE THIS TO RUN
  const { data: availableTeachers = [], isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ["/api/callern/online-teachers"],
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Debug logging - LOG IMMEDIATELY
  console.log('=== CALLERN DEBUG ===');
  console.log('Teachers loading:', teachersLoading);
  console.log('Teachers data:', availableTeachers);
  console.log('Teachers error:', teachersError);
  console.log('User role:', user?.role);
  console.log('==================');

  // Purchase package mutation
  const purchasePackageMutation = useMutation({
    mutationFn: (packageId: number) =>
      apiRequest("/api/student/purchase-callern-package", {
        method: "POST",
        body: JSON.stringify({ packageId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
      toast({
        title: t('callern:packagePurchased'),
        description: t('callern:packagePurchasedDescription'),
      });
      setIsPurchaseDialogOpen(false);
      setSelectedPackage(null);
    },
    onError: (error) => {
      toast({
        title: t('callern:purchaseFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchasePackage = (pkg: CallernPackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedPackage) {
      purchasePackageMutation.mutate(selectedPackage.id);
    }
  };

  const handleStartCall = (teacher: AvailableTeacher) => {
    // Check if student has active package with minutes
    const activePackage = studentPackages.find(
      (pkg: StudentCallernPackage) => pkg.status === 'active' && pkg.remainingMinutes > 0
    );

    if (!activePackage) {
      toast({
        title: t('callern:noActivePackage'),
        description: t('callern:noActivePackageDescription'),
        variant: "destructive",
      });
      return;
    }

    // Generate room ID using crypto for security
    const randomStr = window.crypto.getRandomValues(new Uint8Array(6))
      .reduce((acc, byte) => acc + byte.toString(36), '');
    const roomId = `callern-${Date.now()}-${randomStr}`;

    // Connect to WebSocket and emit call request
    const newSocket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);
    setWaitingForTeacher(true);

    // Authenticate as student
    newSocket.emit('authenticate', {
      userId: user?.id,
      role: 'student'
    });

    // Join the room first (VideoCall won't rejoin for students)
    newSocket.emit('join-room', {
      roomId: roomId,
      userId: user?.id,
      role: 'student'
    });

    // Emit call request to teacher
    newSocket.emit('call-teacher', {
      teacherId: teacher.id,
      studentId: user?.id,
      packageId: activePackage.id, // Use student package ID, not the package definition ID
      language: selectedLanguage,
      roomId: roomId
    });

    // Listen for teacher's response
    newSocket.on('call-accepted', (data) => {
      console.log('Call accepted by teacher:', data);
      setWaitingForTeacher(false);

      // Set up call configuration with proper props for VideoCall component
      setActiveCallConfig({
        roomId,
        userId: user?.id || 0,
        role: 'student' as const,
        onMinutesUpdate: (minutes: number) => {
          console.log(`Call duration: ${minutes} minutes`);
          // Update package minutes here
          queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
        },
        // Store additional data for reference
        teacherId: teacher.id,
        packageId: activePackage.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
      });

      setSelectedTeacher(teacher);
      setIsInCall(true);

      toast({
        title: t('callern:callAccepted'),
        description: t('callern:connectingToTeacher'),
      });
    });

    newSocket.on('call-rejected', (data) => {
      console.log('Call rejected by teacher:', data);
      setWaitingForTeacher(false);
      newSocket.disconnect();
      setSocket(null);

      toast({
        title: t('callern:callRejected'),
        description: data.reason || t('callern:teacherUnavailable'),
        variant: "destructive",
      });
    });

    newSocket.on('error', (data) => {
      console.error('Call error:', data);
      setWaitingForTeacher(false);
      newSocket.disconnect();
      setSocket(null);

      toast({
        title: t('callern:callError'),
        description: data.message || t('callern:connectionFailed'),
        variant: "destructive",
      });
    });

    // Show waiting dialog
    toast({
      title: t('callern:callingTeacher'),
      description: t('callern:waitingForResponse'),
    });
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setSelectedTeacher(null);
    setActiveCallConfig(null);
    setWaitingForTeacher(false);
    
    // Disconnect socket if connected
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Refresh packages and history
    queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student/callern-history"] });
  };

  // Clean up socket on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Show video call interface when in call
  if (isInCall && activeCallConfig) {
    return (
      <VideoCall
        {...activeCallConfig}
        onCallEnd={handleEndCall}
        socket={socket}
      />
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('callern:welcomeTitle')}
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {t('callern:welcomeDescription')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-xs opacity-90">{t('callern:availableBalance')}</p>
                <p className="text-xl font-bold">
                  {studentPackages.reduce((total: number, pkg: StudentCallernPackage) => 
                    total + (pkg.status === 'active' ? pkg.remainingMinutes : 0), 0
                  )} {t('callern:minutes')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with Beautiful Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('callern:activePackages')}</CardTitle>
              <div className="bg-blue-500 p-2 rounded-lg">
                <Package className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {studentPackages.filter((pkg: StudentCallernPackage) => pkg.status === 'active').length}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('callern:packagesAvailable')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">{t('callern:availableMinutes')}</CardTitle>
              <div className="bg-green-500 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {studentPackages.reduce((total: number, pkg: StudentCallernPackage) => 
                  total + (pkg.status === 'active' ? pkg.remainingMinutes : 0), 0
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('callern:minutesRemaining')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('callern:totalCalls')}</CardTitle>
              <div className="bg-purple-500 p-2 rounded-lg">
                <Phone className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{callHistory.length}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{t('callern:callsCompleted')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">{t('callern:thisMonth')}</CardTitle>
              <div className="bg-orange-500 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {callHistory.filter((call: CallHistory) => {
                  const callDate = new Date(call.startedAt);
                  const thisMonth = new Date();
                  return callDate.getMonth() === thisMonth.getMonth() && 
                         callDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t('callern:monthlyCalls')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert if no packages purchased - More prominent */}
        {studentPackages.length === 0 && (
          <Alert className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg">
            <AlertCircle className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
            <AlertDescription>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-bold text-yellow-900 dark:text-yellow-200 text-base mb-1">
                    {t('callern:noActivePackage')}
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                    {t('callern:noActivePackageDescription')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="default"
                  className="w-fit bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                  onClick={() => {
                    // Scroll to packages section
                    const packagesSection = document.querySelector('#packages-section');
                    packagesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t('callern:purchasePackageFirst')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Available Teachers - MOVED UP FOR BETTER VISIBILITY */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-xl">{t('callern:availableTeachers')}</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="text-sm font-normal">
                  {t('callern:selectLanguage')}:
                </label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Persian">Persian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Italian">Italian</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {teachersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>{t('callern:loadingTeachers')}</p>
              </div>
            ) : availableTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('callern:noTeachersAvailable', { language: selectedLanguage })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTeachers.map((teacher: AvailableTeacher) => (
                  <div key={teacher.id} className="border rounded-lg p-4 space-y-3 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {teacher.firstName} {teacher.lastName}
                          </h4>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{teacher.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={teacher.isOnline ? "default" : "secondary"}
                        className={teacher.isOnline ? "animate-pulse" : ""}
                      >
                        {teacher.isOnline ? (
                          <>
                            <Wifi className="mr-1 h-3 w-3" />
                            {t('callern:online')}
                          </>
                        ) : (
                          <>
                            <WifiOff className="mr-1 h-3 w-3" />
                            {t('callern:offline')}
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('callern:languages')}: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.languages.map(lang => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('callern:specializations')}: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.specializations.map(spec => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">{formatPrice(Number(teacher.hourlyRate))}{t('callern:perHour')}</span>
                        <Button
                          size="sm"
                          variant={!teacher.isOnline || studentPackages.filter((p: StudentCallernPackage) => p.status === 'active' && p.remainingMinutes > 0).length === 0 ? "secondary" : "default"}
                          disabled={!teacher.isOnline || studentPackages.filter((p: StudentCallernPackage) => p.status === 'active' && p.remainingMinutes > 0).length === 0}
                          onClick={() => handleStartCall(teacher)}
                          title={studentPackages.filter((p: StudentCallernPackage) => p.status === 'active' && p.remainingMinutes > 0).length === 0 ? t('callern:purchasePackageFirst') : ''}
                        >
                          {studentPackages.filter((p: StudentCallernPackage) => p.status === 'active' && p.remainingMinutes > 0).length === 0 ? (
                            <>
                              <ShoppingCart className="mr-1 h-4 w-4" />
                              {t('callern:purchasePackageFirst')}
                            </>
                          ) : (
                            <>
                              <Video className="mr-1 h-4 w-4" />
                              {t('callern:startVideoCall')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="packages-section">
          {/* Available Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('callern:availablePackagesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <div className="text-center py-4">{t('callern:loadingPackages')}</div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg: CallernPackage) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{pkg.packageName}</h3>
                        <Badge variant="outline">{pkg.totalHours} {t('callern:hours')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(pkg.price)}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handlePurchasePackage(pkg)}
                          disabled={purchasePackageMutation.isPending}
                        >
                          {t('callern:purchase')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t('callern:myPackages')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentPackagesLoading ? (
                <div className="text-center py-4">{t('callern:loadingMyPackages')}</div>
              ) : studentPackages.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {t('callern:noPackagesYet')}
                </div>
              ) : (
                <div className="space-y-4">
                  {studentPackages.map((pkg: StudentCallernPackage) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{pkg.package?.packageName}</h3>
                        <Badge 
                          variant={pkg.status === 'active' ? 'default' : 'secondary'}
                        >
                          {pkg.status === 'active' ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {t('callern:active')}
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              {t(`callern:${pkg.status}`)}
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('callern:remaining')}:</span>
                          <div className="font-medium">{formatDuration(pkg.remainingMinutes)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('common:used')}:</span>
                          <div className="font-medium">{formatDuration(pkg.usedMinutes)}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(pkg.usedMinutes / (pkg.totalHours * 60)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {t('callern:callHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-4">{t('callern:loadingHistory')}</div>
            ) : callHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('callern:noCallsYet')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('callern:teacher')}</TableHead>
                    <TableHead>{t('callern:date')}</TableHead>
                    <TableHead>{t('callern:duration')}</TableHead>
                    <TableHead>{t('common:type')}</TableHead>
                    <TableHead>{t('callern:status')}</TableHead>
                    <TableHead>{t('callern:recording')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callHistory.map((call: CallHistory) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {call.teacherName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(call.startedAt).toLocaleString('fa-IR')}
                      </TableCell>
                      <TableCell>{formatDuration(call.duration)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.callType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={call.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.recordingUrl ? (
                          <Button size="sm" variant="outline">
                            <PlayCircle className="mr-1 h-4 w-4" />
                            {t('callern:viewRecording')}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>



        {/* Purchase Confirmation Dialog */}
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('callern:confirmPurchase')}</DialogTitle>
              <DialogDescription>
                {selectedPackage && t('callern:confirmPurchaseDescription', {
                  packageName: selectedPackage.packageName,
                  hours: selectedPackage.totalHours,
                  price: formatPrice(selectedPackage.price)
                })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedPackage && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{selectedPackage.packageName}</h3>
                  <p className="text-muted-foreground">{selectedPackage.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span>{t('callern:duration')}: {selectedPackage.totalHours} {t('callern:hours')}</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedPackage.price)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsPurchaseDialogOpen(false)}
              >
                {t('callern:cancel')}
              </Button>
              <Button 
                onClick={confirmPurchase}
                disabled={purchasePackageMutation.isPending}
              >
                {purchasePackageMutation.isPending ? t('common:processing') : t('callern:confirmPurchase')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Waiting for Teacher Dialog */}
        <Dialog open={waitingForTeacher} onOpenChange={setWaitingForTeacher}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 animate-pulse text-primary" />
                {t('callern:callingTeacher', 'Calling Teacher...')}
              </DialogTitle>
              <DialogDescription>
                {t('callern:waitingForResponse', 'Waiting for teacher to respond to your call request. This may take a few moments.')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setWaitingForTeacher(false);
                  if (socket) {
                    socket.disconnect();
                    setSocket(null);
                  }
                  toast({
                    title: t('callern:callCancelled', 'Call Cancelled'),
                    description: t('callern:youCancelledCall', 'You have cancelled the call request.'),
                  });
                }}
              >
                {t('common:cancel', 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}