import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  MessageCircle,
  BookOpen,
  Award,
  Filter,
  Search,
  Heart,
  Share,
  TrendingUp,
  Play,
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/use-language";

interface Review {
  id: number;
  rating: number;
  reviewText: string;
  reviewTextFa?: string;
  reviewTextAr?: string;
  studentName: string;
  studentAvatar?: string;
  createdAt: string;
  isAnonymous: boolean;
}

interface Tutor {
  id: number;
  name: string;
  avatar: string;
  specializations: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  completedSessions: number;
  hourlyRate: number;
  availability: string;
  experience: string;
  education: string;
  description: string;
  bio: string;
  responseTime: string;
  successRate: number;
  introVideoUrl?: string;
  packages: Array<{
    sessions: number;
    price: number;
    discount: number;
    popular?: boolean;
  }>;
}

export default function TutorMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [minRatingFilter, setMinRatingFilter] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language: currentLanguage, isRTL } = useLanguage();

  // Fetch tutors
  const { data: tutors, isLoading } = useQuery<Tutor[]>({
    queryKey: ['/api/marketplace/tutors', { 
      language: languageFilter, 
      level: levelFilter, 
      maxPrice: maxPriceFilter,
      minRating: minRatingFilter 
    }],
  });

  // Fetch reviews for selected tutor
  const { data: tutorReviews } = useQuery<Review[]>({
    queryKey: ['/api/reviews/teacher', selectedTutor?.id],
    queryFn: async () => {
      if (!selectedTutor?.id) return [];
      const res = await fetch(`/api/reviews/teacher/${selectedTutor.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedTutor?.id && detailDialogOpen,
  });

  // Book session mutation
  const bookSession = useMutation({
    mutationFn: async (data: {
      tutorId: number;
      packageType: number;
      selectedDate: string;
      selectedTime: string;
      sessionNotes: string;
    }) => {
      return apiRequest(`/api/marketplace/tutors/${data.tutorId}/book`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/tutors'] });
      toast({
        title: currentLanguage === 'fa' ? "جلسه رزرو شد!" : "Session Booked!",
        description: currentLanguage === 'fa' 
          ? "جلسه شما با موفقیت رزرو شد. لطفاً پرداخت را تکمیل کنید" 
          : "Your session has been booked successfully. Please complete payment.",
      });
      setBookingDialogOpen(false);
      resetBookingForm();
    },
    onError: () => {
      toast({
        title: currentLanguage === 'fa' ? "خطا" : "Error",
        description: currentLanguage === 'fa' 
          ? "رزرو جلسه با مشکل مواجه شد" 
          : "Failed to book session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetBookingForm = () => {
    setSelectedPackage(1);
    setSelectedDate("");
    setSelectedTime("");
    setSessionNotes("");
  };

  const handleBookSession = () => {
    if (!selectedTutor || !selectedDate || !selectedTime) {
      toast({
        title: currentLanguage === 'fa' ? "اطلاعات ناقص" : "Missing Information",
        description: currentLanguage === 'fa' 
          ? "لطفاً تاریخ و زمان جلسه را انتخاب کنید" 
          : "Please select date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    bookSession.mutate({
      tutorId: selectedTutor.id,
      packageType: selectedPackage,
      selectedDate,
      selectedTime,
      sessionNotes,
    });
  };

  const formatTomanPrice = (price: number) => {
    return `${(price / 10).toLocaleString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US')} ${currentLanguage === 'fa' ? 'تومان' : 'Toman'}`;
  };

  const filteredTutors = tutors?.filter(tutor => 
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const getLocalizedText = (en: string, fa: string, ar?: string) => {
    if (currentLanguage === 'fa') return fa;
    if (currentLanguage === 'ar') return ar || fa;
    return en;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{getLocalizedText('Loading tutors...', 'در حال بارگذاری...', 'جاري التحميل...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <BackButton href="/dashboard" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getLocalizedText('Tutor Marketplace', 'بازار مربیان', 'سوق المدرسين')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getLocalizedText('Find the best language tutors', 'بهترین مربیان زبان را پیدا کنید', 'ابحث عن أفضل مدرسي اللغة')}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={getLocalizedText('Search tutor or specialization', 'جستجوی مربی یا تخصص', 'البحث عن مدرس أو تخصص')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getLocalizedText('Language', 'زبان', 'اللغة')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getLocalizedText('All Languages', 'همه زبان‌ها', 'جميع اللغات')}</SelectItem>
                <SelectItem value="persian">{getLocalizedText('Persian', 'فارسی', 'الفارسية')}</SelectItem>
                <SelectItem value="english">{getLocalizedText('English', 'انگلیسی', 'الإنجليزية')}</SelectItem>
                <SelectItem value="arabic">{getLocalizedText('Arabic', 'عربی', 'العربية')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getLocalizedText('Level', 'سطح', 'المستوى')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getLocalizedText('All Levels', 'همه سطوح', 'جميع المستويات')}</SelectItem>
                <SelectItem value="beginner">{getLocalizedText('Beginner', 'مبتدی', 'مبتدئ')}</SelectItem>
                <SelectItem value="intermediate">{getLocalizedText('Intermediate', 'متوسط', 'متوسط')}</SelectItem>
                <SelectItem value="advanced">{getLocalizedText('Advanced', 'پیشرفته', 'متقدم')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={maxPriceFilter} onValueChange={setMaxPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getLocalizedText('Max Price', 'حداکثر قیمت', 'الحد الأقصى للسعر')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getLocalizedText('All Prices', 'همه قیمت‌ها', 'جميع الأسعار')}</SelectItem>
                <SelectItem value="200000">{getLocalizedText('Under 20K Toman', 'زیر ۲۰ هزار تومان', 'أقل من 20 ألف تومان')}</SelectItem>
                <SelectItem value="300000">{getLocalizedText('Under 30K Toman', 'زیر ۳۰ هزار تومان', 'أقل من 30 ألف تومان')}</SelectItem>
                <SelectItem value="400000">{getLocalizedText('Under 40K Toman', 'زیر ۴۰ هزار تومان', 'أقل من 40 ألف تومان')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getLocalizedText('Rating', 'امتیاز', 'التقييم')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getLocalizedText('All Ratings', 'همه امتیازها', 'جميع التقييمات')}</SelectItem>
                <SelectItem value="4.5">{getLocalizedText('4.5+ Stars', '۴.۵+ ستاره', '4.5+ نجوم')}</SelectItem>
                <SelectItem value="4.0">{getLocalizedText('4+ Stars', '۴+ ستاره', '4+ نجوم')}</SelectItem>
                <SelectItem value="3.5">{getLocalizedText('3.5+ Stars', '۳.۵+ ستاره', '3.5+ نجوم')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTutors.length} {getLocalizedText('tutors found', 'مربی یافت شد', 'مدرس تم العثور عليه')}
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {getLocalizedText('More Filters', 'فیلترهای بیشتر', 'مزيد من الفلاتر')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tutors Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={tutor.avatar} alt={tutor.name} />
                    <AvatarFallback>{tutor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{tutor.name}</h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{tutor.rating}</span>
                      <span className="text-sm text-gray-500">({tutor.reviewCount})</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {tutor.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {tutor.specializations.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tutor.experience}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tutor.completedSessions} {getLocalizedText('sessions', 'جلسه', 'جلسات')}</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tutor.successRate}% {getLocalizedText('success', 'موفقیت', 'نجاح')}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-xs truncate">{tutor.responseTime.split(' ').slice(0, 3).join(' ')}</span>
                  </div>
                </div>

                {/* Intro Video Indicator */}
                {tutor.introVideoUrl && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Video className="h-4 w-4" />
                    <span>{getLocalizedText('Intro video available', 'ویدیو معرفی موجود', 'فيديو تعريفي متاح')}</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {formatTomanPrice(tutor.hourlyRate)}
                      </p>
                      <p className="text-xs text-gray-500">{getLocalizedText('per hour', 'هر ساعت', 'لكل ساعة')}</p>
                    </div>
                    <Badge 
                      variant={tutor.availability.includes('Available') ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tutor.availability.includes('Available') 
                        ? getLocalizedText('Available', 'آماده', 'متاح') 
                        : getLocalizedText('Busy', 'مشغول', 'مشغول')}
                    </Badge>
                  </div>

                  <div className="flex space-x-2 gap-2">
                    {/* View Details Button */}
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setDetailDialogOpen(true);
                      }}
                    >
                      {getLocalizedText('View Details', 'مشاهده جزئیات', 'عرض التفاصيل')}
                    </Button>

                    {/* Book Session Button */}
                    <Dialog open={bookingDialogOpen && selectedTutor?.id === tutor.id} onOpenChange={setBookingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1" 
                          onClick={() => setSelectedTutor(tutor)}
                        >
                          {getLocalizedText('Book Session', 'رزرو جلسه', 'حجز جلسة')}
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {getLocalizedText(`Book Session with ${tutor.name}`, `رزرو جلسه با ${tutor.name}`, `حجز جلسة مع ${tutor.name}`)}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="packages" className="space-y-6">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="packages">{getLocalizedText('Packages', 'بسته‌ها', 'الباقات')}</TabsTrigger>
                            <TabsTrigger value="schedule">{getLocalizedText('Schedule', 'زمان‌بندی', 'الجدول')}</TabsTrigger>
                            <TabsTrigger value="confirm">{getLocalizedText('Confirm', 'تأیید', 'تأكيد')}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="packages" className="space-y-4">
                            <div className="grid gap-4">
                              {tutor.packages.map((pkg, index) => (
                                <div
                                  key={index}
                                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedPackage === pkg.sessions 
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  } ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}
                                  onClick={() => setSelectedPackage(pkg.sessions)}
                                >
                                  {pkg.popular && (
                                    <Badge className="mb-2">{getLocalizedText('Popular', 'محبوب', 'شائع')}</Badge>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        {pkg.sessions} {getLocalizedText('Sessions', 'جلسه', 'جلسات')}
                                      </h4>
                                      {pkg.discount > 0 && (
                                        <p className="text-sm text-green-600">
                                          {pkg.discount}% {getLocalizedText('Discount', 'تخفیف', 'خصم')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold">{formatTomanPrice(pkg.price)}</p>
                                      {pkg.discount > 0 && (
                                        <p className="text-sm text-gray-500 line-through">
                                          {formatTomanPrice(pkg.sessions * tutor.hourlyRate)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="schedule" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  {getLocalizedText('Date', 'تاریخ', 'التاريخ')}
                                </label>
                                <Input
                                  type="date"
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  {getLocalizedText('Time', 'زمان', 'الوقت')}
                                </label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={getLocalizedText('Select time', 'انتخاب زمان', 'اختر الوقت')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="09:00">09:00 {getLocalizedText('AM', 'صبح', 'صباحاً')}</SelectItem>
                                    <SelectItem value="14:00">14:00 {getLocalizedText('PM', 'بعدازظهر', 'مساءً')}</SelectItem>
                                    <SelectItem value="16:00">16:00 {getLocalizedText('PM', 'بعدازظهر', 'مساءً')}</SelectItem>
                                    <SelectItem value="18:00">18:00 {getLocalizedText('PM', 'عصر', 'مساءً')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                {getLocalizedText('Session Notes (Optional)', 'یادداشت جلسه (اختیاری)', 'ملاحظات الجلسة (اختياري)')}
                              </label>
                              <Textarea
                                placeholder={getLocalizedText(
                                  'Describe your learning goals or any specific topics you want to cover...',
                                  'اهداف یادگیری یا موضوعات خاصی که می‌خواهید پوشش دهید را توضیح دهید...',
                                  'صف أهداف التعلم الخاصة بك أو أي موضوعات محددة تريد تغطيتها...'
                                )}
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="confirm" className="space-y-4">
                            <Card>
                              <CardContent className="pt-6">
                                <h4 className="font-medium mb-4">{getLocalizedText('Booking Summary', 'خلاصه رزرو', 'ملخص الحجز')}</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>{getLocalizedText('Tutor', 'مربی', 'المدرس')}</span>
                                    <span className="font-medium">{tutor.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{getLocalizedText('Package', 'بسته', 'الباقة')}</span>
                                    <span className="font-medium">{selectedPackage} {getLocalizedText('Sessions', 'جلسه', 'جلسات')}</span>
                                  </div>
                                  {selectedDate && (
                                    <div className="flex justify-between">
                                      <span>{getLocalizedText('First Session', 'جلسه اول', 'الجلسة الأولى')}</span>
                                      <span className="font-medium">{selectedDate} - {selectedTime}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t">
                                    <span className="font-medium">{getLocalizedText('Total', 'مجموع', 'المجموع')}</span>
                                    <span className="font-bold text-green-600">
                                      {formatTomanPrice(
                                        tutor.packages.find(p => p.sessions === selectedPackage)?.price || 
                                        selectedPackage * tutor.hourlyRate
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Button 
                              className="w-full" 
                              onClick={handleBookSession}
                              disabled={!selectedDate || !selectedTime || bookSession.isPending}
                            >
                              {bookSession.isPending 
                                ? getLocalizedText('Booking...', 'در حال رزرو...', 'جاري الحجز...')
                                : getLocalizedText('Confirm Booking', 'تأیید رزرو', 'تأكيد الحجز')}
                            </Button>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tutor Detail Dialog with Intro Video and Reviews */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden">
          {selectedTutor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedTutor.avatar} alt={selectedTutor.name} />
                    <AvatarFallback>{selectedTutor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedTutor.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{selectedTutor.rating}</span>
                      <span>({selectedTutor.reviewCount} {getLocalizedText('reviews', 'نظر', 'مراجعات')})</span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh]">
                <Tabs defaultValue="intro" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="intro">{getLocalizedText('Intro Video', 'ویدیو معرفی', 'فيديو تعريفي')}</TabsTrigger>
                    <TabsTrigger value="about">{getLocalizedText('About', 'درباره', 'حول')}</TabsTrigger>
                    <TabsTrigger value="reviews">{getLocalizedText('Reviews', 'نظرات', 'المراجعات')}</TabsTrigger>
                  </TabsList>

                  {/* Intro Video Tab */}
                  <TabsContent value="intro" className="space-y-4">
                    {selectedTutor.introVideoUrl ? (
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video 
                          src={selectedTutor.introVideoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                          poster={selectedTutor.avatar}
                        >
                          {getLocalizedText(
                            'Your browser does not support the video tag.',
                            'مرورگر شما از ویدیو پشتیبانی نمی‌کند.',
                            'متصفحك لا يدعم علامة الفيديو.'
                          )}
                        </video>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                        <Video className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {getLocalizedText(
                            'No intro video available',
                            'ویدیو معرفی موجود نیست',
                            'لا يوجد فيديو تعريفي متاح'
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          setDetailDialogOpen(false);
                          setBookingDialogOpen(true);
                        }}
                      >
                        {getLocalizedText('Book Session', 'رزرو جلسه', 'حجز جلسة')}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* About Tab */}
                  <TabsContent value="about" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{getLocalizedText('Bio', 'بیوگرافی', 'السيرة الذاتية')}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedTutor.bio}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">{getLocalizedText('Experience', 'تجربه', 'الخبرة')}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedTutor.experience}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">{getLocalizedText('Education', 'تحصیلات', 'التعليم')}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedTutor.education}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">{getLocalizedText('Specializations', 'تخصص‌ها', 'التخصصات')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTutor.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">{getLocalizedText('Languages', 'زبان‌ها', 'اللغات')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTutor.languages.map((lang, index) => (
                            <Badge key={index} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{selectedTutor.successRate}%</p>
                          <p className="text-sm text-gray-500">{getLocalizedText('Success Rate', 'نرخ موفقیت', 'معدل النجاح')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{selectedTutor.completedSessions}</p>
                          <p className="text-sm text-gray-500">{getLocalizedText('Sessions', 'جلسات', 'جلسات')}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{selectedTutor.rating}</span>
                        {renderStars(Math.round(selectedTutor.rating))}
                        <span className="text-gray-500">({selectedTutor.reviewCount} {getLocalizedText('reviews', 'نظر', 'مراجعات')})</span>
                      </div>
                    </div>

                    {tutorReviews && tutorReviews.length > 0 ? (
                      <div className="space-y-4">
                        {tutorReviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.studentAvatar} />
                                  <AvatarFallback>
                                    {review.isAnonymous ? '?' : review.studentName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">
                                      {review.isAnonymous 
                                        ? getLocalizedText('Anonymous', 'ناشناس', 'مجهول')
                                        : review.studentName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(review.createdAt).toLocaleDateString(
                                        currentLanguage === 'fa' ? 'fa-IR' : 
                                        currentLanguage === 'ar' ? 'ar' : 'en-US'
                                      )}
                                    </span>
                                  </div>
                                  {renderStars(review.rating)}
                                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                                    {currentLanguage === 'fa' && review.reviewTextFa 
                                      ? review.reviewTextFa 
                                      : currentLanguage === 'ar' && review.reviewTextAr
                                        ? review.reviewTextAr
                                        : review.reviewText}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>{getLocalizedText('No reviews yet', 'هنوز نظری ثبت نشده', 'لا توجد مراجعات بعد')}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
