import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Target, BookOpen, Star, Activity } from "lucide-react";

interface CohortStudent {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  progress?: number;
}

interface CohortData {
  totalStudents?: number;
  averageProgress?: number;
  onTrackCount?: number;
  completedGoals?: number;
  students?: CohortStudent[];
}

type VelocityData = Record<string, number>;

export default function MentorProgressPage() {
  const { t } = useTranslation(['mentor', 'common']);
  const { user } = useAuth();

  const { data: progressData, isLoading } = useQuery<CohortData>({
    queryKey: ['/api/enhanced-mentoring/analytics/mentor', user?.id, 'cohort'],
    enabled: !!user?.id,
  });

  const { data: velocityData } = useQuery<VelocityData>({
    queryKey: ['/api/enhanced-mentoring/analytics/mentor', user?.id, 'velocity-distribution'],
    enabled: !!user?.id,
  });

  const cohort = progressData;
  const velocity = velocityData;

  const statCards = [
    {
      label: t('mentor:progress.totalStudents', 'دانش‌آموزان'),
      value: cohort?.totalStudents ?? '—',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('mentor:progress.avgProgress', 'میانگین پیشرفت'),
      value: cohort?.averageProgress != null ? `${Math.round(cohort.averageProgress)}%` : '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: t('mentor:progress.onTrack', 'در مسیر'),
      value: cohort?.onTrackCount ?? '—',
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: t('mentor:progress.completedGoals', 'اهداف تکمیل‌شده'),
      value: cohort?.completedGoals ?? '—',
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
  ];

  const students: CohortStudent[] = cohort?.students ?? [];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('mentor:progress.title', 'پیشرفت دانش‌آموزان')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('mentor:progress.subtitle', 'نمای کلی پیشرفت دانش‌آموزان شما')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-2`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-blue-500" />
            {t('mentor:progress.studentList', 'پیشرفت دانش‌آموزان')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('mentor:progress.noData', 'اطلاعاتی موجود نیست')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {student.name || `${student.firstName} ${student.lastName}`}
                      </p>
                      <Badge variant={student.progress >= 70 ? 'default' : student.progress >= 40 ? 'secondary' : 'destructive'}>
                        {student.progress ?? 0}%
                      </Badge>
                    </div>
                    <Progress value={student.progress ?? 0} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {velocity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('mentor:progress.velocityDistribution', 'توزیع سرعت یادگیری')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {Object.entries(velocity).map(([key, val]) => (
                <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{val}</p>
                  <p className="text-xs text-gray-500 capitalize">{key}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
