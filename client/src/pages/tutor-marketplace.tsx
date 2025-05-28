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
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tutors
  const { data: tutors, isLoading } = useQuery<Tutor[]>({
    queryKey: ['/api/marketplace/tutors', { 
      language: languageFilter, 
      level: levelFilter, 
      maxPrice: maxPriceFilter,
      minRating: minRatingFilter 
    }],
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
        title: "جلسه رزرو شد! / Session Booked!",
        description: "جلسه شما با موفقیت رزرو شد. لطفاً پرداخت را تکمیل کنید / Your session has been booked successfully. Please complete payment.",
      });
      setBookingDialogOpen(false);
      resetBookingForm();
    },
    onError: () => {
      toast({
        title: "خطا / Error",
        description: "رزرو جلسه با مشکل مواجه شد / Failed to book session. Please try again.",
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
        title: "اطلاعات ناقص / Missing Information",
        description: "لطفاً تاریخ و زمان جلسه را انتخاب کنید / Please select date and time for your session.",
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
    return `${(price / 10).toLocaleString('fa-IR')} تومان`;
  };

  const filteredTutors = tutors?.filter(tutor => 
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              بازار مربیان / Tutor Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              بهترین مربیان زبان فارسی را پیدا کنید / Find the best Persian language tutors
            </p>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجوی مربی یا تخصص / Search tutor or specialization"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-right"
                />
              </div>
            </div>
            
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="زبان / Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">همه زبان‌ها / All Languages</SelectItem>
                <SelectItem value="persian">فارسی / Persian</SelectItem>
                <SelectItem value="english">انگلیسی / English</SelectItem>
                <SelectItem value="arabic">عربی / Arabic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="سطح / Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">همه سطوح / All Levels</SelectItem>
                <SelectItem value="beginner">مبتدی / Beginner</SelectItem>
                <SelectItem value="intermediate">متوسط / Intermediate</SelectItem>
                <SelectItem value="advanced">پیشرفته / Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={maxPriceFilter} onValueChange={setMaxPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="حداکثر قیمت / Max Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">همه قیمت‌ها / All Prices</SelectItem>
                <SelectItem value="200000">زیر ۲۰ هزار تومان / Under 20K Toman</SelectItem>
                <SelectItem value="300000">زیر ۳۰ هزار تومان / Under 30K Toman</SelectItem>
                <SelectItem value="400000">زیر ۴۰ هزار تومان / Under 40K Toman</SelectItem>
              </SelectContent>
            </Select>

            <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="امتیاز / Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">همه امتیازها / All Ratings</SelectItem>
                <SelectItem value="4.5">۴.۵+ ستاره / 4.5+ Stars</SelectItem>
                <SelectItem value="4.0">۴+ ستاره / 4+ Stars</SelectItem>
                <SelectItem value="3.5">۳.۵+ ستاره / 3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTutors.length} مربی یافت شد / {filteredTutors.length} tutors found
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                فیلترهای بیشتر / More Filters
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
                    <span>{tutor.completedSessions} جلسه</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tutor.successRate}% موفقیت</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-xs">{tutor.responseTime.split(' ').slice(0, 3).join(' ')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {formatTomanPrice(tutor.hourlyRate)}
                      </p>
                      <p className="text-xs text-gray-500">هر ساعت / per hour</p>
                    </div>
                    <Badge 
                      variant={tutor.availability.includes('Available') ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tutor.availability.includes('Available') ? 'آماده' : 'مشغول'}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Dialog open={bookingDialogOpen && selectedTutor?.id === tutor.id} onOpenChange={setBookingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1" 
                          onClick={() => setSelectedTutor(tutor)}
                        >
                          رزرو جلسه / Book Session
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>رزرو جلسه با {tutor.name} / Book Session with {tutor.name}</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="packages" className="space-y-6">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="packages">بسته‌ها / Packages</TabsTrigger>
                            <TabsTrigger value="schedule">زمان‌بندی / Schedule</TabsTrigger>
                            <TabsTrigger value="confirm">تأیید / Confirm</TabsTrigger>
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
                                    <Badge className="mb-2">محبوب / Popular</Badge>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        {pkg.sessions} جلسه / {pkg.sessions} Sessions
                                      </h4>
                                      {pkg.discount > 0 && (
                                        <p className="text-sm text-green-600">
                                          {pkg.discount}% تخفیف / {pkg.discount}% Discount
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
                                  تاریخ / Date
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
                                  زمان / Time
                                </label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب زمان / Select time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="09:00">09:00 صبح / 9:00 AM</SelectItem>
                                    <SelectItem value="14:00">14:00 بعدازظهر / 2:00 PM</SelectItem>
                                    <SelectItem value="16:00">16:00 بعدازظهر / 4:00 PM</SelectItem>
                                    <SelectItem value="18:00">18:00 عصر / 6:00 PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                یادداشت‌های جلسه / Session Notes
                              </label>
                              <Textarea
                                placeholder="اهداف یادگیری، موضوعات خاص، یا درخواست‌های ویژه / Learning goals, specific topics, or special requests"
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="confirm" className="space-y-4">
                            <div className="border rounded-lg p-4 space-y-3">
                              <h4 className="font-medium">خلاصه رزرو / Booking Summary</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span>مربی / Tutor:</span>
                                <span>{tutor.name}</span>
                                <span>بسته / Package:</span>
                                <span>{selectedPackage} جلسه / {selectedPackage} sessions</span>
                                <span>تاریخ / Date:</span>
                                <span>{selectedDate}</span>
                                <span>زمان / Time:</span>
                                <span>{selectedTime}</span>
                                <span>قیمت کل / Total Price:</span>
                                <span className="font-bold text-green-600">
                                  {formatTomanPrice(tutor.packages.find(p => p.sessions === selectedPackage)?.price || 0)}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={handleBookSession} 
                              disabled={bookSession.isPending}
                              className="w-full"
                            >
                              {bookSession.isPending ? 
                                "در حال رزرو... / Booking..." : 
                                "تأیید و پرداخت / Confirm & Pay"
                              }
                            </Button>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              مربی یافت نشد / No Tutors Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              لطفاً فیلترهای خود را تغییر دهید / Please adjust your filters and try again
            </p>
          </div>
        )}
      </div>
    </div>
  );
}