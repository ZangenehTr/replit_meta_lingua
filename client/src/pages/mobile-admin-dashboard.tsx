import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  Settings,
  Plus,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalStudents: number;
  activeTeachers: number;
  totalCourses: number;
  monthlyRevenue: number;
  growth: {
    students: number;
    revenue: number;
  };
  alerts: {
    pendingPayments: number;
    inactiveStudents: number;
    systemIssues: number;
  };
}

// Quick Action Cards for Mobile
const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  color, 
  onClick 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  change?: number;
  color: string;
  onClick: () => void;
}) => (
  <MobileCard 
    variant="interactive" 
    className={cn("mobile-transition", `border-l-4 border-l-${color}-500`)}
    onClick={onClick}
  >
    <MobileCardContent>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={cn(`flex items-center justify-center w-12 h-12 rounded-lg bg-${color}-100 mb-3`)}>
            <Icon className={cn("h-6 w-6", `text-${color}-600`)} />
          </div>
          <h3 className="font-semibold text-lg leading-tight">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-xs text-green-600">+{change}%</span>
            </div>
          )}
        </div>
      </div>
    </MobileCardContent>
  </MobileCard>
);

// Alert Card Component
const AlertCard = ({ 
  type, 
  count, 
  message, 
  action 
}: {
  type: "warning" | "error" | "info";
  count: number;
  message: string;
  action: () => void;
}) => {
  const colors = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800", 
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  const icons = {
    warning: AlertCircle,
    error: AlertCircle,
    info: CheckCircle
  };

  const Icon = icons[type];

  return (
    <MobileCard variant="outlined" className={cn("border-2", colors[type])}>
      <MobileCardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{message}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {count} items
              </Badge>
            </div>
          </div>
          <MobileButton 
            variant="ghost" 
            size="sm"
            onClick={action}
          >
            View
          </MobileButton>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

export function MobileAdminDashboard() {
  const { t } = useTranslation(['admin', 'common']);
  const [, setLocation] = useLocation();

  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard-stats", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    }
  });

  const quickActions = [
    {
      icon: Users,
      title: "Students",
      value: stats?.totalStudents || 0,
      change: stats?.growth.students,
      color: "blue",
      route: "/admin/students"
    },
    {
      icon: GraduationCap,
      title: "Teachers", 
      value: stats?.activeTeachers || 0,
      color: "green",
      route: "/admin/teachers"
    },
    {
      icon: BookOpen,
      title: "Courses",
      value: stats?.totalCourses || 0,
      color: "purple",
      route: "/admin/courses"
    },
    {
      icon: DollarSign,
      title: "Revenue",
      value: stats?.monthlyRevenue ? `${(stats.monthlyRevenue / 1000000).toFixed(1)}M IRR` : "0 IRR",
      change: stats?.growth.revenue,
      color: "emerald", 
      route: "/admin/financial"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{t('admin:dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin:dashboard.adminControlCenter')}
          </p>
        </div>
        <div className="flex gap-2">
          <MobileButton
            variant="outline"
            size="sm"
            leftIcon={<Search className="h-4 w-4" />}
            onClick={() => setLocation("/admin/search")}
          />
          <MobileButton
            variant="outline"
            size="sm"
            leftIcon={<Settings className="h-4 w-4" />}
            onClick={() => setLocation("/admin/settings")}
          />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              icon={action.icon}
              title={action.title}
              value={action.value}
              change={action.change}
              color={action.color}
              onClick={() => setLocation(action.route)}
            />
          ))}
        </div>
      </div>

      {/* System Alerts */}
      {stats?.alerts && (
        <div>
          <h2 className="text-lg font-semibold mb-4">System Alerts</h2>
          <div className="space-y-3">
            {stats.alerts.pendingPayments > 0 && (
              <AlertCard
                type="warning"
                count={stats.alerts.pendingPayments}
                message="Pending payment approvals"
                action={() => setLocation("/admin/payments")}
              />
            )}
            {stats.alerts.inactiveStudents > 0 && (
              <AlertCard
                type="info"
                count={stats.alerts.inactiveStudents}
                message="Students need attention"
                action={() => setLocation("/admin/students")}
              />
            )}
            {stats.alerts.systemIssues > 0 && (
              <AlertCard
                type="error"
                count={stats.alerts.systemIssues}
                message="System issues detected"
                action={() => setLocation("/admin/system")}
              />
            )}
          </div>
        </div>
      )}

      {/* Quick Communication */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Communication</h2>
        <div className="grid grid-cols-2 gap-3">
          <MobileButton
            variant="outline"
            size="lg"
            leftIcon={<MessageSquare className="h-5 w-5" />}
            onClick={() => setLocation("/admin/communications")}
            className="h-14"
          >
            Message Center
          </MobileButton>
          <MobileButton
            variant="outline"
            size="lg"
            leftIcon={<Phone className="h-5 w-5" />}
            onClick={() => setLocation("/admin/voip")}
            className="h-14"
          >
            VoIP Center
          </MobileButton>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <MobileButton
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/activity")}
          >
            View All
          </MobileButton>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">New student enrolled</p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Payment processed</p>
              <p className="text-xs text-muted-foreground">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Teacher updated availability</p>
              <p className="text-xs text-muted-foreground">12 minutes ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <MobileButton
        variant="default"
        size="fab"
        className="fixed bottom-20 right-4 z-30 shadow-lg"
        onClick={() => setLocation("/admin/create")}
        leftIcon={<Plus className="h-6 w-6" />}
      />
    </div>
  );
}

export default MobileAdminDashboard;