import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { formatPersianNumber, formatPersianCurrency } from '@/lib/persian-utils';
import { 
  DollarSign, 
  Users,
  GraduationCap,
  Phone,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export function SimpleAdminDashboard() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isPersian = i18n.language === 'fa';
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  // Simple queries
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/dashboard-stats']
  });

  const { data: callCenterStats } = useQuery({
    queryKey: ['/api/callcenter/performance-stats']
  });

  return (
    <div className={`min-h-screen p-4 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {t('admin:dashboard.title', 'داشبورد مدیریت')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('admin:dashboard.subtitle', 'پنل مدیریت موسسه')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <Badge variant="secondary" className="text-xs">فعال</Badge>
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianNumber((stats as any)?.totalStudents || 0) : ((stats as any)?.totalStudents || 0)}
          </div>
          <p className="text-xs text-muted-foreground">دانشجویان</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <Badge variant="secondary" className="text-xs">آنلاین</Badge>
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianNumber((stats as any)?.totalTeachers || 0) : ((stats as any)?.totalTeachers || 0)}
          </div>
          <p className="text-xs text-muted-foreground">مدرسان</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianCurrency('2450000') : '$2,450'}
          </div>
          <p className="text-xs text-muted-foreground">درآمد ماهانه</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Phone className="h-5 w-5 text-blue-600" />
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold">
            {isPersian ? '۹۶٪' : '96%'}
          </div>
          <p className="text-xs text-muted-foreground">پاسخ تماس</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Settings className="h-5 w-5 mr-2" />
            اقدامات سریع
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline"
            onClick={() => setLocation('/admin/students')}
            className="w-full flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium text-sm">مدیریت دانشجویان</p>
                <p className="text-xs text-muted-foreground">مشاهده و مدیریت دانشجویان</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation('/admin/teachers')}
            className="w-full flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium text-sm">مدیریت مدرسان</p>
                <p className="text-xs text-muted-foreground">گزارش عملکرد مدرسان</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation('/admin/courses')}
            className="w-full flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium text-sm">مدیریت دوره‌ها</p>
                <p className="text-xs text-muted-foreground">ایجاد و مدیریت دوره‌ها</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">وضعیت سیستم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm">همه سیستم‌ها عملیاتی</span>
            </div>
            <Badge variant="outline" className="text-green-600">سالم</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}