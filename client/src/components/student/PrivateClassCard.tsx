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
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface PrivateClassData {
  hasPrivateClass: boolean;
  packageName: string | null;
  teacherName: string | null;
  remainingSessions: number;
  totalSessions: number;
  startDate: string | null;
  expiryDate: string | null;
  isActive: boolean;
  lowSessionAlertThreshold: number;
  alertFiredAt: string | null;
}

export function PrivateClassCard() {
  const { data, isLoading, error } = useQuery<PrivateClassData>({
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

  if (error || !data || !data.hasPrivateClass) {
    return null;
  }

  const pct = data.totalSessions > 0
    ? Math.round((data.remainingSessions / data.totalSessions) * 100)
    : 0;

  const isLow = data.remainingSessions <= data.lowSessionAlertThreshold;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isLow ? "border-orange-300" : "border-blue-200"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            کلاس خصوصی من
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={data.isActive ? "default" : "secondary"}>
              {data.isActive ? "فعال" : "پایان یافته"}
            </Badge>
            {isLow && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                نیاز به تمدید
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.packageName && (
          <p className="text-sm text-gray-600 font-medium">{data.packageName}</p>
        )}

        {data.teacherName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="h-4 w-4 text-purple-500" />
            <span>استاد: <strong>{data.teacherName}</strong></span>
          </div>
        )}

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
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>جلسات باقیمانده</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isLow ? "bg-orange-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {isLow && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-md p-3 text-sm text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            جلسات شما رو به اتمام است. برای تمدید با پشتیبانی تماس بگیرید.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
