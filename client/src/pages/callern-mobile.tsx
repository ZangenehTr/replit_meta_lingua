import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VideoCall } from "@/components/callern/VideoCall";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileCard } from "@/components/mobile/MobileCard";
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
  WifiOff
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

export default function CallernMobilePage() {
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

  // Fetch available teachers - Mock data for now
  const availableTeachers: AvailableTeacher[] = [
    {
      id: 1,
      firstName: "Sarah",
      lastName: "Johnson",
      languages: ["English", "Spanish"],
      specializations: ["Business", "Conversation"],
      rating: 4.8,
      hourlyRate: 25,
      isOnline: true,
    },
    {
      id: 2,
      firstName: "Ahmed",
      lastName: "Hassan",
      languages: ["Arabic", "English"],
      specializations: ["Academic", "IELTS"],
      rating: 4.9,
      hourlyRate: 30,
      isOnline: true,
    },
    {
      id: 3,
      firstName: "Reza",
      lastName: "Mohammadi",
      languages: ["Persian", "English"],
      specializations: ["Conversation", "Kids"],
      rating: 4.7,
      hourlyRate: 20,
      isOnline: false,
    },
  ];
  const teachersLoading = false;

  // Purchase package mutation
  const purchasePackageMutation = useMutation({
    mutationFn: (packageData: CallernPackage) => 
      apiRequest("/api/student/purchase-callern-package", "POST", packageData),
    onSuccess: () => {
      toast({
        title: t('callern:purchaseSuccess'),
        description: t('callern:purchaseSuccessDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
      setIsPurchaseDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t('callern:purchaseFailed'),
        description: t('callern:purchaseFailedDesc'),
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
      purchasePackageMutation.mutate(selectedPackage);
    }
  };

  const handleStartCall = (teacher: AvailableTeacher) => {
    const callConfig = {
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      language: selectedLanguage,
      userId: user?.id,
      userName: `${user?.firstName} ${user?.lastName}`,
      role: 'student',
    };
    setActiveCallConfig(callConfig);
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setActiveCallConfig(null);
    queryClient.invalidateQueries({ queryKey: ["/api/student/callern-history"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isInCall && activeCallConfig) {
    return (
      <VideoCall
        config={activeCallConfig}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <div className="relative p-6 pt-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('callern:title')}
          </h1>
          <p className="text-purple-200">
            {t('callern:subtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-around p-4">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'teachers'
                ? 'bg-white/20 text-white backdrop-blur-md'
                : 'text-white/60'
            }`}
          >
            <Users className="h-5 w-5 mx-auto mb-1" />
            {t('callern:teachers')}
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'packages'
                ? 'bg-white/20 text-white backdrop-blur-md'
                : 'text-white/60'
            }`}
          >
            <Package className="h-5 w-5 mx-auto mb-1" />
            {t('callern:packages')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white/20 text-white backdrop-blur-md'
                : 'text-white/60'
            }`}
          >
            <History className="h-5 w-5 mx-auto mb-1" />
            {t('callern:history')}
          </button>
        </div>

        {/* Content Area */}
        <div className="px-4 pb-24">
          {/* Available Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              {/* Language Selector */}
              <MobileCard className="p-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">
                  {t('callern:selectLanguage')}
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-purple-200 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                </select>
              </MobileCard>

              {/* Teachers List */}
              {teachersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/60">{t('callern:loadingTeachers')}</p>
                </div>
              ) : availableTeachers.filter((t: AvailableTeacher) => 
                t.languages.includes(selectedLanguage)
              ).length === 0 ? (
                <MobileCard className="p-8 text-center">
                  <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('callern:noTeachersAvailable', { language: selectedLanguage })}
                  </p>
                </MobileCard>
              ) : (
                availableTeachers
                  .filter((teacher: AvailableTeacher) => 
                    teacher.languages.includes(selectedLanguage)
                  )
                  .map((teacher: AvailableTeacher) => (
                    <MobileCard key={teacher.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                              {teacher.firstName} {teacher.lastName}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {teacher.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={`${
                            teacher.isOnline 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {teacher.isOnline ? (
                            <><Wifi className="h-3 w-3 mr-1" /> {t('callern:online')}</>
                          ) : (
                            <><WifiOff className="h-3 w-3 mr-1" /> {t('callern:offline')}</>
                          )}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.languages.map(lang => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {teacher.specializations.map(spec => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatPrice(teacher.hourlyRate)}/hr
                        </span>
                        <Button
                          onClick={() => handleStartCall(teacher)}
                          disabled={!teacher.isOnline || studentPackages.length === 0}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          {t('callern:startCall')}
                        </Button>
                      </div>
                    </MobileCard>
                  ))
              )}
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              {/* My Packages */}
              {studentPackages.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t('callern:myPackages')}
                  </h2>
                  {studentPackages.map((pkg: StudentCallernPackage) => (
                    <MobileCard key={pkg.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {pkg.package?.packageName}
                        </h3>
                        <Badge 
                          className={
                            pkg.status === 'active' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }
                        >
                          {pkg.status === 'active' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> {t('callern:active')}</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> {t(`callern:${pkg.status}`)}</>
                          )}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('callern:remaining')}:
                          </span>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {formatDuration(pkg.remainingMinutes)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('common:used')}:
                          </span>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {formatDuration(pkg.usedMinutes)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${(pkg.usedMinutes / (pkg.totalHours * 60)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </>
              )}

              {/* Available Packages */}
              <h2 className="text-xl font-semibold text-white mb-3 mt-6">
                {t('callern:availablePackages')}
              </h2>
              {packagesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/60">{t('callern:loadingPackages')}</p>
                </div>
              ) : packages.length === 0 ? (
                <MobileCard className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('callern:noPackagesAvailable')}
                  </p>
                </MobileCard>
              ) : (
                packages.map((pkg: CallernPackage) => (
                  <MobileCard key={pkg.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {pkg.packageName}
                      </h3>
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? t('callern:active') : t('callern:inactive')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {pkg.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{pkg.totalHours} {t('callern:hours')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatPrice(pkg.price)}
                      </span>
                      <Button 
                        onClick={() => handlePurchasePackage(pkg)}
                        disabled={purchasePackageMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t('callern:purchase')}
                      </Button>
                    </div>
                  </MobileCard>
                ))
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-3">
                {t('callern:callHistory')}
              </h2>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/60">{t('callern:loadingHistory')}</p>
                </div>
              ) : callHistory.length === 0 ? (
                <MobileCard className="p-8 text-center">
                  <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('callern:noCallsYet')}
                  </p>
                </MobileCard>
              ) : (
                callHistory.map((call: CallHistory) => (
                  <MobileCard key={call.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {call.teacherName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(call.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        className={
                          call.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }
                      >
                        {call.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('callern:duration')}:
                        </span>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatDuration(call.duration)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('common:type')}:
                        </span>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {call.callType}
                        </p>
                      </div>
                    </div>

                    {call.recordingUrl && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => window.open(call.recordingUrl, '_blank')}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {t('callern:viewRecording')}
                      </Button>
                    )}
                  </MobileCard>
                ))
              )}
            </div>
          )}
        </div>

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
      </div>
    </MobileLayout>
  );
}