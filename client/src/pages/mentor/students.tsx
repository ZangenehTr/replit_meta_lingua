import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Search, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";

type StudentSummary = {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  progress?: number;
  level?: string;
  riskLevel?: string;
  courseName?: string;
  lastActivity?: string;
};

export default function MentorStudentsPage() {
  const { t } = useTranslation(['mentor', 'common']);
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useQuery<StudentSummary[]>({
    queryKey: ['/api/mentor/mentees'],
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) => {
      const name = s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`;
      return name.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q);
    });
  }, [students, search]);

  const getRiskIcon = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return <Badge variant="destructive">{t('mentor:students.highRisk', 'ریسک بالا')}</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('mentor:students.mediumRisk', 'ریسک متوسط')}</Badge>;
      default: return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('mentor:students.onTrack', 'در مسیر')}</Badge>;
    }
  };

  const getInitials = (student: StudentSummary) => {
    if (student.name) return student.name.slice(0, 2).toUpperCase();
    return `${(student.firstName?.[0] ?? '')}${(student.lastName?.[0] ?? '')}`.toUpperCase() || 'S';
  };

  const summaryStats = [
    { label: t('mentor:students.total', 'کل دانش‌آموزان'), value: students.length, icon: Users, color: 'text-blue-500' },
    { label: t('mentor:students.onTrack', 'در مسیر'), value: students.filter(s => !s.riskLevel || s.riskLevel === 'low').length, icon: CheckCircle, color: 'text-green-500' },
    { label: t('mentor:students.atRisk', 'نیاز به توجه'), value: students.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium').length, icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('mentor:students.title', 'دانش‌آموزان من')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('mentor:students.subtitle', 'مدیریت و پایش دانش‌آموزان شما')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                {isLoading ? <Skeleton className="h-6 w-10 mb-1" /> : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                )}
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            {t('mentor:students.list', 'لیست دانش‌آموزان')}
          </CardTitle>
          <div className="relative mt-2">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('mentor:students.search', 'جستجوی دانش‌آموز...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('mentor:students.noStudents', 'دانش‌آموزی یافت نشد')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((student) => {
                const name = student.name ?? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
                return (
                  <div key={student.id} className="py-3 flex items-center gap-4">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        {getInitials(student)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(student.riskLevel)}
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {name || `دانش‌آموز #${student.id}`}
                          </p>
                        </div>
                        {getRiskBadge(student.riskLevel)}
                      </div>
                      {student.progress != null && (
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-gray-500 shrink-0">{student.progress}%</span>
                        </div>
                      )}
                      {student.courseName && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{student.courseName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
