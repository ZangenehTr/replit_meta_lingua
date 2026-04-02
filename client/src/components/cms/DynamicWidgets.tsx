import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  Calendar, 
  Users, 
  Trophy, 
  BookOpen, 
  Clock,
  MapPin,
  Video
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface WidgetProps {
  limit?: number;
  className?: string;
}

const getLocalizedText = (currentLanguage: string, en: string, fa: string, ar?: string) => {
  if (currentLanguage === 'fa') return fa;
  if (currentLanguage === 'ar') return ar || fa;
  return en;
};

export function TopTeachersWidget({ limit = 5, className = "" }: WidgetProps) {
  const { language: currentLanguage, isRTL } = useLanguage();
  
  const { data: teachers, isLoading } = useQuery<any[]>({
    queryKey: ['/api/public/widgets/top-teachers', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/public/widgets/top-teachers?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {getLocalizedText(currentLanguage, 'Top Teachers', 'برترین مربیان', 'أفضل المعلمين')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {getLocalizedText(currentLanguage, 'Top Teachers', 'برترین مربیان', 'أفضل المعلمين')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teachers?.map((teacher, index) => (
            <div key={teacher.id} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={teacher.avatar} alt={`${teacher.firstName} ${teacher.lastName}`} />
                  <AvatarFallback>{teacher.firstName?.[0]}{teacher.lastName?.[0]}</AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <Badge 
                    className={`absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}
                  >
                    {index + 1}
                  </Badge>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{teacher.rating}</span>
                  <span>({teacher.reviewCount} {getLocalizedText(currentLanguage, 'reviews', 'نظر', 'مراجعات')})</span>
                </div>
              </div>
              {teacher.introVideoUrl && (
                <Video className="h-4 w-4 text-blue-500" />
              )}
            </div>
          ))}
          {(!teachers || teachers.length === 0) && (
            <p className="text-center text-gray-500 py-4">
              {getLocalizedText(currentLanguage, 'No teachers found', 'مربی یافت نشد', 'لم يتم العثور على معلمين')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentReviewsWidget({ limit = 5, className = "" }: WidgetProps) {
  const { language: currentLanguage, isRTL } = useLanguage();
  
  const { data: reviews, isLoading } = useQuery<any[]>({
    queryKey: ['/api/public/reviews/recent', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/public/reviews/recent?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {getLocalizedText(currentLanguage, 'Recent Reviews', 'نظرات اخیر', 'المراجعات الأخيرة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {getLocalizedText(currentLanguage, 'Recent Reviews', 'نظرات اخیر', 'المراجعات الأخيرة')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews?.map((review) => (
            <div key={review.id} className="border-b pb-3 last:border-0 last:pb-0">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.studentAvatar} />
                  <AvatarFallback>{review.studentName?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {review.isAnonymous 
                      ? getLocalizedText(currentLanguage, 'Anonymous', 'ناشناس', 'مجهول')
                      : review.studentName}
                  </p>
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {currentLanguage === 'fa' && review.reviewTextFa 
                  ? review.reviewTextFa 
                  : currentLanguage === 'ar' && review.reviewTextAr
                    ? review.reviewTextAr
                    : review.reviewText}
              </p>
            </div>
          ))}
          {(!reviews || reviews.length === 0) && (
            <p className="text-center text-gray-500 py-4">
              {getLocalizedText(currentLanguage, 'No reviews yet', 'هنوز نظری ثبت نشده', 'لا توجد مراجعات بعد')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingEventsWidget({ limit = 5, className = "" }: WidgetProps) {
  const { language: currentLanguage, isRTL } = useLanguage();
  
  const { data: events, isLoading } = useQuery<any[]>({
    queryKey: ['/api/public/events/upcoming', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/public/events/upcoming?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      currentLanguage === 'fa' ? 'fa-IR' : 
      currentLanguage === 'ar' ? 'ar' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-purple-100 text-purple-800',
      seminar: 'bg-blue-100 text-blue-800',
      webinar: 'bg-green-100 text-green-800',
      class_opening: 'bg-yellow-100 text-yellow-800',
      exam: 'bg-red-100 text-red-800',
      holiday: 'bg-orange-100 text-orange-800',
      celebration: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {getLocalizedText(currentLanguage, 'Upcoming Events', 'رویدادهای آینده', 'الأحداث القادمة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          {getLocalizedText(currentLanguage, 'Upcoming Events', 'رویدادهای آینده', 'الأحداث القادمة')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events?.map((event) => (
            <div key={event.id} className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {formatDate(event.startDate).split(' ')[0]}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatDate(event.startDate).split(' ')[1]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {currentLanguage === 'fa' && event.titleFa 
                    ? event.titleFa 
                    : currentLanguage === 'ar' && event.titleAr
                      ? event.titleAr
                      : event.title}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="secondary" className={`text-xs ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType.replace('_', ' ')}
                  </Badge>
                  {event.isOnline ? (
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {getLocalizedText(currentLanguage, 'Online', 'آنلاین', 'عبر الإنترنت')}
                    </span>
                  ) : event.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {currentLanguage === 'fa' && event.locationFa ? event.locationFa : event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!events || events.length === 0) && (
            <p className="text-center text-gray-500 py-4">
              {getLocalizedText(currentLanguage, 'No upcoming events', 'رویدادی در پیش نیست', 'لا توجد أحداث قادمة')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NewClassesWidget({ limit = 5, className = "" }: WidgetProps) {
  const { language: currentLanguage, isRTL } = useLanguage();
  
  const { data: classes, isLoading } = useQuery<any[]>({
    queryKey: ['/api/public/widgets/new-classes', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/public/widgets/new-classes?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const formatPrice = (price: number) => {
    return `${(price / 10).toLocaleString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US')} ${currentLanguage === 'fa' ? 'تومان' : 'Toman'}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            {getLocalizedText(currentLanguage, 'New Classes', 'کلاس‌های جدید', 'فصول جديدة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          {getLocalizedText(currentLanguage, 'New Classes', 'کلاس‌های جدید', 'فصول جديدة')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes?.map((cls) => (
            <div key={cls.id} className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <p className="font-medium">
                  {currentLanguage === 'fa' && cls.nameFa 
                    ? cls.nameFa 
                    : currentLanguage === 'ar' && cls.nameAr
                      ? cls.nameAr
                      : cls.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {cls.level && (
                    <Badge variant="outline" className="text-xs">{cls.level}</Badge>
                  )}
                  {cls.language && (
                    <span>{cls.language}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Users className="h-3 w-3" />
                  <span>{cls.enrolledCount || 0}/{cls.capacity || '∞'}</span>
                  {cls.startDate && (
                    <>
                      <Clock className="h-3 w-3 ms-2" />
                      <span>{new Date(cls.startDate).toLocaleDateString(
                        currentLanguage === 'fa' ? 'fa-IR' : 'en-US'
                      )}</span>
                    </>
                  )}
                </div>
              </div>
              {cls.price && (
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(cls.price)}
                </span>
              )}
            </div>
          ))}
          {(!classes || classes.length === 0) && (
            <p className="text-center text-gray-500 py-4">
              {getLocalizedText(currentLanguage, 'No new classes', 'کلاس جدیدی موجود نیست', 'لا توجد فصول جديدة')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BestStudentWidget({ period = 'month', className = "" }: { period?: 'week' | 'month' | 'year'; className?: string }) {
  const { language: currentLanguage, isRTL } = useLanguage();
  
  const { data: student, isLoading } = useQuery<any>({
    queryKey: ['/api/public/widgets/best-student', { period }],
    queryFn: async () => {
      const res = await fetch(`/api/public/widgets/best-student?period=${period}`);
      if (!res.ok) return null;
      return res.json();
    }
  });

  const getPeriodLabel = () => {
    const labels: Record<string, { en: string; fa: string; ar: string }> = {
      week: { en: 'This Week', fa: 'این هفته', ar: 'هذا الأسبوع' },
      month: { en: 'This Month', fa: 'این ماه', ar: 'هذا الشهر' },
      year: { en: 'This Year', fa: 'امسال', ar: 'هذا العام' }
    };
    return getLocalizedText(currentLanguage, labels[period].en, labels[period].fa, labels[period].ar);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {getLocalizedText(currentLanguage, 'Best Student', 'بهترین دانش‌آموز', 'أفضل طالب')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <Skeleton className="h-20 w-20 rounded-full mb-4" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {getLocalizedText(currentLanguage, 'Best Student', 'بهترین دانش‌آموز', 'أفضل طالب')}
          </span>
          <Badge variant="outline" className="text-xs">{getPeriodLabel()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {student ? (
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.avatar} alt={`${student.firstName} ${student.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -end-2 bg-yellow-500 text-white rounded-full p-1">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <h4 className="text-lg font-bold">
              {student.firstName} {student.lastName}
            </h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {student.totalXp?.toLocaleString() || 0} XP
              </span>
              <span>
                {getLocalizedText(currentLanguage, 'Level', 'سطح', 'المستوى')} {student.currentLevel || 1}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{student.streakDays || 0} {getLocalizedText(currentLanguage, 'day streak', 'روز پیاپی', 'أيام متتالية')}</span>
              <span>{student.totalLessons || 0} {getLocalizedText(currentLanguage, 'lessons', 'درس', 'دروس')}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{getLocalizedText(currentLanguage, 'No student data available', 'اطلاعاتی موجود نیست', 'لا تتوفر بيانات الطالب')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const DynamicWidgets = {
  TopTeachers: TopTeachersWidget,
  RecentReviews: RecentReviewsWidget,
  UpcomingEvents: UpcomingEventsWidget,
  NewClasses: NewClassesWidget,
  BestStudent: BestStudentWidget
};
