import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  AlertTriangle,
  GraduationCap,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface SessionRecord {
  id: number;
  sessionDate: string;
  actualDuration: number;
  topicsCovered: string | null;
  teacherNotes: string | null;
  attendanceStatus: string;
}

interface PrivateClassData {
  id: number;
  teacher: { id: number; firstName: string; lastName: string; profileImage: string | null };
  bundle: { id: number; name: string };
  totalSessions: number;
  remainingSessions: number;
  sessionDuration: number;
  status: 'active' | 'completed' | 'expired';
  startDate: string | null;
  expiryDate: string | null;
  nextScheduledAt: string | null;
  isLowSession: boolean;
  sessions: SessionRecord[];
}

export function PrivateClassCard() {
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading, error } = useQuery<PrivateClassData | null>({
    queryKey: ["/api/student/private-class"],
    queryFn: () => apiRequest(`/api/student/private-class`),
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const pct = data.totalSessions > 0
    ? Math.round((data.remainingSessions / data.totalSessions) * 100)
    : 0;

  const teacherName = `${data.teacher.firstName} ${data.teacher.lastName}`.trim();

  const attendanceLabel = (s: string) =>
    s === 'attended' ? 'حضور' : s === 'absent' ? 'غایب' : 'لغو';

  return (
    <Card className={`hover:shadow-md transition-shadow ${data.isLowSession ? "border-orange-300" : "border-blue-200"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            کلاس خصوصی من
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={data.status === 'active' ? "default" : "secondary"}>
              {data.status === 'active' ? "فعال" : data.status === 'completed' ? "تکمیل" : "منقضی"}
            </Badge>
            {data.isLowSession && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                نیاز به تمدید
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 font-medium">{data.bundle.name}</p>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <GraduationCap className="h-4 w-4 text-purple-500" />
          <span>استاد: <strong>{teacherName}</strong></span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span><strong>{data.remainingSessions}</strong> از {data.totalSessions} جلسه</span>
          </div>
          {data.expiryDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>انقضا: {new Date(data.expiryDate).toLocaleDateString('fa-IR')}</span>
            </div>
          )}
          {data.startDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-green-500" />
              <span>شروع: {new Date(data.startDate).toLocaleDateString('fa-IR')}</span>
            </div>
          )}
          {data.nextScheduledAt && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700">
                جلسه بعدی: {new Date(data.nextScheduledAt).toLocaleDateString('fa-IR')} ساعت {new Date(data.nextScheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {!data.nextScheduledAt && data.status === 'active' && (
            <div className="flex items-center gap-2 text-gray-400 col-span-2 text-xs">
              <Calendar className="h-3 w-3" />
              <span>جلسه بعدی هنوز تعیین نشده</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>جلسات باقیمانده</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${data.isLowSession ? "bg-orange-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {data.isLowSession && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-md p-3 text-sm text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            جلسات شما رو به اتمام است. برای تمدید با پشتیبانی تماس بگیرید.
          </div>
        )}

        {data.sessions.length > 0 && (
          <div>
            <Button variant="ghost" size="sm" className="w-full gap-2" onClick={() => setShowHistory(h => !h)}>
              <ClipboardList className="h-4 w-4" />
              تاریخچه جلسات ({data.sessions.length})
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showHistory && (
              <div className="mt-2 space-y-2">
                {data.sessions.slice(0, 10).map(s => (
                  <div key={s.id} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('fa-IR') : '—'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{s.actualDuration} دقیقه</span>
                        <Badge variant={s.attendanceStatus === 'attended' ? 'default' : 'secondary'} className="text-xs py-0">
                          {attendanceLabel(s.attendanceStatus)}
                        </Badge>
                      </div>
                    </div>
                    {s.topicsCovered && <p className="text-gray-600">موضوع: {s.topicsCovered}</p>}
                    {s.teacherNotes && <p className="text-gray-500 italic">یادداشت استاد: {s.teacherNotes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
