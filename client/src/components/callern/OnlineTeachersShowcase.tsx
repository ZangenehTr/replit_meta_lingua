import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Video,
  Star,
  Globe,
  Award,
  Clock,
  Users,
  ArrowRight,
  Wifi
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface OnlineTeacher {
  id: number;
  name: string;
  profileImageUrl?: string;
  specialty?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  certification?: string;
  experience?: string;
  isOnline: boolean;
  nextAvailableTime?: string;
}

interface OnlineTeachersShowcaseProps {
  variant?: 'compact' | 'full';
  maxTeachers?: number;
  className?: string;
  onTeacherSelect?: (teacherId: number) => void;
  showViewAll?: boolean;
}

export function OnlineTeachersShowcase({
  variant = 'full',
  maxTeachers = 6,
  className,
  onTeacherSelect,
  showViewAll = true
}: OnlineTeachersShowcaseProps) {
  const { t, i18n } = useTranslation(['student', 'callern']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  const { data: teachers = [], isLoading } = useQuery<OnlineTeacher[]>({
    queryKey: ['/api/callern/online-teachers'],
    refetchInterval: 60000, // Refresh every minute
  });

  const onlineTeachers = teachers.filter(t => t.isOnline).slice(0, maxTeachers);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)} data-testid="loading-online-teachers">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className={cn(
          "grid gap-4",
          variant === 'compact' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (onlineTeachers.length === 0) {
    return (
      <Card className={className} data-testid="no-online-teachers">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-2">
            {t('student:onlineTeachers.noTeachersOnline', 'No Teachers Online')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('student:onlineTeachers.checkBackSoon', 'Our teachers will be online soon. Check back in a few minutes.')}
          </p>
          <Button asChild variant="outline" data-testid="button-view-schedule">
            <Link href="/callern">
              <a>
                <Clock className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('student:onlineTeachers.viewSchedule', 'View Teacher Schedule')}
              </a>
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)} data-testid="online-teachers-showcase">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {t('student:onlineTeachers.heading', 'Online Teachers')}
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {onlineTeachers.length} {t('student:onlineTeachers.available', 'Available')}
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('student:onlineTeachers.description', 'Connect instantly with expert teachers')}
            </p>
          </div>
        </div>
        {showViewAll && (
          <Button asChild variant="ghost" size="sm" data-testid="button-view-all-teachers">
            <Link href="/callern">
              <a className="flex items-center gap-1">
                {t('student:onlineTeachers.viewAll', 'View All')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </Button>
        )}
      </div>

      {/* Teachers Grid */}
      <div className={cn(
        "grid gap-4",
        variant === 'compact' 
          ? "grid-cols-1 md:grid-cols-2" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {onlineTeachers.map((teacher) => (
          <Card 
            key={teacher.id} 
            className="hover:shadow-md transition-shadow group" 
            data-testid={`teacher-card-${teacher.id}`}
          >
            <CardContent className="p-4">
              {/* Teacher Info */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    {teacher.profileImageUrl ? (
                      <AvatarImage src={teacher.profileImageUrl} alt={teacher.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
                        {teacher.name?.charAt(0) || 'T'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* Online Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{teacher.name || 'Expert Teacher'}</h4>
                  <p className="text-xs text-muted-foreground truncate">{teacher.specialty || 'English Teacher'}</p>
                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-3 w-3",
                          i < Math.floor(teacher.rating || 5) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground">
                      ({teacher.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Teacher Details */}
              <div className="space-y-2 text-xs text-muted-foreground mb-4">
                {teacher.country && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{teacher.country}</span>
                  </div>
                )}
                {teacher.certification && (
                  <div className="flex items-center gap-2">
                    <Award className="h-3 w-3 shrink-0" />
                    <span className="truncate">{teacher.certification}</span>
                  </div>
                )}
                {teacher.experience && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">{teacher.experience}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                size="sm"
                onClick={() => onTeacherSelect?.(teacher.id)}
                data-testid={`button-connect-${teacher.id}`}
              >
                <Video className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('student:onlineTeachers.connectNow', 'Connect Now')}
              </Button>

              {teacher.nextAvailableTime && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {t('student:onlineTeachers.availableNow', 'Available now')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action Footer */}
      {variant === 'full' && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg border border-primary/10">
          <div>
            <h4 className="font-semibold text-sm">
              {t('student:onlineTeachers.ctaTitle', 'Need more time?')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('student:onlineTeachers.ctaDescription', 'Purchase a CallerN package to start learning')}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" data-testid="button-buy-package">
            <Link href="/callern">
              <a>
                {t('student:onlineTeachers.buyPackage', 'View Packages')}
              </a>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
