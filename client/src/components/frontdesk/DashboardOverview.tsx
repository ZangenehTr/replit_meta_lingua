import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Users, Phone, AlertCircle, Calendar, UserPlus, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocation } from "wouter";

interface DashboardStats { pendingOperations: number; completedToday: number; callsToday: number; urgentFollowUps: number; todayTrialsCount: number; confirmedTrials: number; conversionRate: number; averageResponseTime: number; unreadNotifications: number; priorityNotifications: number; overdueTasks: number; totalTasks: number; }

interface OperationRecord { id: number; visitorName: string; interestedLanguage?: string; visitedAt: string; status: string; priority?: string; convertedToLead?: boolean; convertedToStudent?: boolean; [key: string]: unknown; }

interface PerformanceMetrics { targets?: { dailyOperations: number; [key: string]: unknown }; [key: string]: unknown; }

interface Props { dashboardStats: DashboardStats; operations: OperationRecord[]; performanceMetrics: PerformanceMetrics | undefined; setSelectedView: (v: "overview" | "tasks" | "followups" | "trials" | "analytics") => void; setSelectedCustomer: (name: string | null) => void; formatTime: (d: Date | string) => string; getStatusColor: (s: string) => string; }

export function DashboardOverview({ dashboardStats, operations, performanceMetrics, setSelectedView, setSelectedCustomer, formatTime, getStatusColor }: Props) {
  const { t } = useTranslation(['frontdesk']);
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  const stats = [
    { label: t('frontdesk:stats.pendingOperations'), value: dashboardStats.pendingOperations, cls: "text-blue-600", icon: Users, sub: t('frontdesk:stats.walkInsNeedingAttention'), testId: "stat-pending-operations", progress: (dashboardStats.pendingOperations / 10) * 100, action: null },
    { label: t('frontdesk:stats.todaysCalls'), value: dashboardStats.callsToday, cls: "text-green-600", icon: Phone, sub: t('frontdesk:stats.phoneCallsHandled'), testId: "stat-calls-today", trend: dashboardStats.callsToday > 20, progress: null, action: null },
    { label: t('frontdesk:stats.urgentFollowUps'), value: dashboardStats.urgentFollowUps, cls: "text-red-600", icon: AlertCircle, sub: t('frontdesk:stats.requireImmediateAction'), testId: "stat-urgent-followups", progress: null, action: dashboardStats.urgentFollowUps > 0 ? () => setSelectedView("followups") : null },
    { label: t('frontdesk:stats.todaysTrials'), value: `${dashboardStats.confirmedTrials}/${dashboardStats.todayTrialsCount}`, cls: "text-purple-600", icon: Calendar, sub: t('frontdesk:stats.confirmedOfTotal'), testId: "stat-today-trials", progress: dashboardStats.todayTrialsCount > 0 ? (dashboardStats.confirmedTrials / dashboardStats.todayTrialsCount) * 100 : 0, action: null },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, cls, icon: Icon, sub, testId, progress, trend, action }) => (
          <Card key={testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cls}`} data-testid={testId}>{value}</div>
              <p className="text-xs text-muted-foreground">{sub}</p>
              {progress !== null && progress !== undefined && <div className="mt-2"><Progress value={progress} className="h-2" /></div>}
              {trend !== undefined && <div className="flex items-center mt-2">{trend ? <TrendingUp className="h-3 w-3 text-green-500 me-1" /> : <TrendingDown className="h-3 w-3 text-red-500 me-1" />}<span className="text-xs text-gray-500">{t('frontdesk:stats.vsYesterday')}</span></div>}
              {action && <Button size="sm" className="mt-2 w-full" onClick={action}>{t('frontdesk:stats.viewAll')}</Button>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><div className="flex items-center justify-between"><CardTitle>{t('frontdesk:views.recentOperations')}</CardTitle><Button variant="outline" size="sm" onClick={() => setLocation("/frontdesk/walk-in-intake")}><UserPlus className="h-4 w-4 me-2" />{t('frontdesk:quickActions.newWalkIn')}</Button></div></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(operations) && operations.slice(0, 5).map((op) => (
                <div key={op.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setSelectedCustomer(op.visitorName)}>
                  <div className="flex-1"><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-500 text-white text-sm">{op.visitorName.charAt(0)}</AvatarFallback></Avatar><div><h4 className="font-medium">{op.visitorName}</h4><p className="text-sm text-gray-500">{op.interestedLanguage} • {formatTime(op.visitedAt)}</p></div></div></div>
                  <div className="flex items-center gap-2"><Badge className={getStatusColor(op.status)}>{op.status.replace("_", " ")}</Badge>{op.priority === "high" && <Badge variant="destructive" className="text-xs">{t('frontdesk:followUps.urgent')}</Badge>}<ChevronRight className="h-4 w-4 text-gray-400" /></div>
                </div>
              ))}
              {(!operations || operations.length === 0) && <div className="text-center py-8 text-gray-500"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{isRTL ? "هنوز عملیاتی ثبت نشده" : "No operations recorded yet"}</p></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('frontdesk:views.todaysPerformance')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              [t('frontdesk:stats.conversionRate'), `${dashboardStats.conversionRate.toFixed(1)}%`, dashboardStats.conversionRate],
              [t('frontdesk:stats.avgResponse'), `${Math.round(dashboardStats.averageResponseTime)} ${t('frontdesk:stats.sec')}`, Math.min((dashboardStats.averageResponseTime / 300) * 100, 100)],
              [t('frontdesk:stats.taskCompletion'), `${dashboardStats.totalTasks > 0 ? Math.round(((dashboardStats.totalTasks - dashboardStats.overdueTasks) / dashboardStats.totalTasks) * 100) : 100}%`, dashboardStats.totalTasks > 0 ? ((dashboardStats.totalTasks - dashboardStats.overdueTasks) / dashboardStats.totalTasks) * 100 : 100],
            ].map(([label, val, pct]) => (
              <div key={label as string} className="space-y-2"><div className="flex justify-between text-sm"><span>{label as string}</span><span className="font-medium">{val as string}</span></div><Progress value={pct as number} className="h-2" /></div>
            ))}
            <Separator />
            <div className="space-y-3"><h4 className="font-medium text-sm">{t('frontdesk:stats.dailyGoals')}</h4>
              {performanceMetrics?.targets && <div className="space-y-2"><div className="flex justify-between text-xs"><span>{t('frontdesk:stats.operations')}</span><span>{dashboardStats.completedToday}/{performanceMetrics.targets.dailyOperations}</span></div><Progress value={(dashboardStats.completedToday / performanceMetrics.targets.dailyOperations) * 100} className="h-1" /></div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
