import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { formatPersianNumber, formatPersianPercentage, formatPersianCurrency } from '@/lib/persian-utils';
import { 
  DollarSign, 
  TrendingUp, 
  BookOpen,
  GraduationCap,
  Server,
  Phone,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Calendar,
  Star,
  Award,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

export function MobileAdminDashboard() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isPersian = i18n.language === 'fa';
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch essential metrics only
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-stats']
  });

  const { data: callCenterStats } = useQuery({
    queryKey: ['/api/callcenter/performance-stats']
  });

  const { data: financialKPIs } = useQuery({
    queryKey: ['/api/admin/financial-kpis']
  });

  // Add debug logging
  console.log('MobileAdminDashboard rendering:', { isLoading, stats, user });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  const QuickActionButton = ({ icon: Icon, title, description, onClick, variant = "default" }: {
    icon: any;
    title: string;
    description: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  }) => (
    <Button 
      variant={variant}
      onClick={onClick}
      className="h-auto p-4 flex flex-col items-start text-left w-full"
    >
      <div className="flex items-center w-full mb-2">
        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
        <span className="font-medium text-sm">{title}</span>
        {isRTL ? <ArrowLeft className="h-4 w-4 ml-auto" /> : <ArrowRight className="h-4 w-4 ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Button>
  );

  return (
    <div className={`min-h-screen bg-background p-4 pb-20 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Mobile Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('admin:dashboard.title', 'داشبورد')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('admin:dashboard.subtitle', 'پنل مدیریت موسسه')}
        </p>
      </div>

      {/* Key Metrics - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <Badge variant="secondary" className="text-xs">فعال</Badge>
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianNumber((stats as any)?.totalStudents || 0) : ((stats as any)?.totalStudents || 0)}
          </div>
          <p className="text-xs text-muted-foreground">{t('admin:dashboard.totalStudents')}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <Badge variant="secondary" className="text-xs">آنلاین</Badge>
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianNumber((stats as any)?.totalTeachers || 0) : ((stats as any)?.totalTeachers || 0)}
          </div>
          <p className="text-xs text-muted-foreground">{t('admin:dashboard.totalTeachers')}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianCurrency((financialKPIs as any)?.totalRevenue || '0') : `$${(financialKPIs as any)?.totalRevenue || '0'}`}
          </div>
          <p className="text-xs text-muted-foreground">{t('admin:dashboard.monthlyRevenue')}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Phone className="h-5 w-5 text-blue-600" />
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold">
            {isPersian ? formatPersianPercentage((callCenterStats as any)?.responseRate || '0') : `${(callCenterStats as any)?.responseRate || '0'}%`}
          </div>
          <p className="text-xs text-muted-foreground">{t('admin:dashboard.callResponseRate')}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            {t('admin:dashboard.quickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <QuickActionButton
            icon={Users}
            title={t('admin:dashboard.manageStudents')}
            description={t('admin:dashboard.viewAndManageStudents')}
            onClick={() => setLocation('/admin/students')}
          />
          
          <QuickActionButton
            icon={GraduationCap}
            title={t('admin:dashboard.manageTeachers')}
            description={t('admin:dashboard.teacherPerformanceReports')}
            onClick={() => setLocation('/admin/teachers')}
          />
          
          <QuickActionButton
            icon={BookOpen}
            title={t('admin:dashboard.courses')}
            description={t('admin:dashboard.createAndManageCourses')}
            onClick={() => setLocation('/admin/courses')}
          />
          
          <QuickActionButton
            icon={DollarSign}
            title={t('admin:dashboard.financialReports')}
            description={t('admin:dashboard.revenueAndPayments')}
            onClick={() => setLocation('/admin/financial')}
          />
          
          <QuickActionButton
            icon={BarChart3}
            title={t('admin:dashboard.analytics')}
            description={t('admin:dashboard.detailedAnalytics')}
            onClick={() => setLocation('/admin/analytics')}
          />
        </CardContent>
      </Card>

      {/* System Health - Simplified */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Server className="h-5 w-5 mr-2" />
            {t('admin:dashboard.systemStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm">{t('admin:dashboard.allSystemsOperational')}</span>
            </div>
            <Badge variant="outline" className="text-green-600">
              {t('admin:dashboard.healthy')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('admin:dashboard.lastUpdated')}</span>
            <span className="text-xs text-muted-foreground">
              {isPersian ? 'چند دقیقه پیش' : 'Few minutes ago'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {t('admin:dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('admin:dashboard.newStudentRegistered')}</p>
                <p className="text-xs text-muted-foreground">
                  {isPersian ? '۵ دقیقه پیش' : '5 minutes ago'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('admin:dashboard.paymentReceived')}</p>
                <p className="text-xs text-muted-foreground">
                  {isPersian ? '۱۰ دقیقه پیش' : '10 minutes ago'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('admin:dashboard.classScheduled')}</p>
                <p className="text-xs text-muted-foreground">
                  {isPersian ? '۱۵ دقیقه پیش' : '15 minutes ago'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}