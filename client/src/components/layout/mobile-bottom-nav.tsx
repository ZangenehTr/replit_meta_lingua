import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Settings,
  Home,
  ClipboardList,
  TrendingUp,
  Phone,
  Target,
  DollarSign,
  UserCheck,
  BarChart3,
  Calendar,
  Shield
} from "lucide-react";

interface BottomNavItem {
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

// Role-based navigation configurations
const getRoleNavigation = (role: string, t: (key: string) => string): BottomNavItem[] => {
  // Normalize role to handle both lowercase and capitalized versions
  const normalizedRole = role.toLowerCase();
  
  switch (normalizedRole) {
    case 'admin':
    case 'supervisor':
      return [
        { route: "/dashboard", icon: LayoutDashboard, label: t('common:navigation.dashboard') },
        { route: "/admin/students", icon: Users, label: t('common:navigation.students') },
        { route: "/admin/communications", icon: MessageSquare, label: t('common:navigation.chat') },
        { route: "/admin/system", icon: Settings, label: t('common:navigation.settings') }
      ];
      
    case 'teacher/tutor':
    case 'teacher':
    case 'tutor':
      return [
        { route: "/dashboard", icon: Home, label: t('common:navigation.dashboard') },
        { route: "/teacher/classes", icon: GraduationCap, label: t('common:navigation.classes') },
        { route: "/teacher/assignments", icon: ClipboardList, label: t('common:navigation.assignments') },
        { route: "/teacher/students", icon: Users, label: t('common:navigation.students') }
      ];
      
    case 'student':
      return [
        { route: "/dashboard", icon: Home, label: t('common:student.navigation.home') },
        { route: "/student/courses", icon: BookOpen, label: t('common:student.navigation.courses') },
        { route: "/student/homework", icon: ClipboardList, label: t('common:student.navigation.homework') },
        { route: "/student/profile", icon: UserCheck, label: t('common:student.navigation.profile') }
      ];
      
    case 'call center agent':
    case 'callcenter':
    case 'call center':
      return [
        { route: "/dashboard", icon: LayoutDashboard, label: t('common:navigation.dashboard') },
        { route: "/callcenter/leads", icon: Target, label: t('common:navigation.leads') },
        { route: "/callcenter/voip", icon: Phone, label: t('common:navigation.calls') },
        { route: "/callcenter/performance", icon: BarChart3, label: t('common:navigation.performance') }
      ];
      
    case 'mentor':
      return [
        { route: "/dashboard", icon: Home, label: t('common:navigation.dashboard') },
        { route: "/mentor/students", icon: Users, label: t('common:navigation.students') },
        { route: "/mentor/sessions", icon: Calendar, label: t('common:navigation.sessions') },
        { route: "/mentor/progress", icon: TrendingUp, label: t('common:navigation.progress') }
      ];
      
    case 'accountant':
      return [
        { route: "/dashboard", icon: LayoutDashboard, label: t('common:navigation.dashboard') },
        { route: "/accountant/payments", icon: DollarSign, label: t('common:navigation.payments') },
        { route: "/accountant/reports", icon: BarChart3, label: t('common:navigation.reports') },
        { route: "/accountant/compliance", icon: Shield, label: t('common:navigation.compliance') }
      ];
      
    default:
      console.warn(`Unknown role in mobile nav: ${role}, falling back to student navigation`);
      return [
        { route: "/dashboard", icon: Home, label: t('common:navigation.dashboard') },
        { route: "/courses", icon: BookOpen, label: t('common:navigation.courses') },
        { route: "/assignments", icon: ClipboardList, label: t('common:navigation.assignments') },
        { route: "/profile", icon: UserCheck, label: t('common:navigation.profile') }
      ];
  }
};

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation(['common']);
  const { isRTL } = useLanguage();
  
  if (!user) return null;
  
  const navigationItems = getRoleNavigation(user.role, t);
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-inset-bottom",
      "md:hidden", // Only show on mobile
      className
    )}>
      <div className="grid grid-cols-4 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.route || (location.startsWith(item.route) && item.route !== "/");
          
          return (
            <button
              key={item.route}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(item.route);
              }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 relative touch-target",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs leading-none truncate max-w-full">
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;