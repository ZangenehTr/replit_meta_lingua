import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
const getRoleNavigation = (role: string): BottomNavItem[] => {
  switch (role) {
    case 'Admin':
    case 'Supervisor':
      return [
        { route: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { route: "/admin/students", icon: Users, label: "Students" },
        { route: "/admin/communications", icon: MessageSquare, label: "Chat" },
        { route: "/admin/system", icon: Settings, label: "Settings" }
      ];
      
    case 'Teacher/Tutor':
      return [
        { route: "/teacher", icon: Home, label: "Home" },
        { route: "/teacher/classes", icon: GraduationCap, label: "Classes" },
        { route: "/teacher/assignments", icon: ClipboardList, label: "Tasks" },
        { route: "/teacher/students", icon: Users, label: "Students" }
      ];
      
    case 'Student':
      return [
        { route: "/dashboard", icon: Home, label: "Home" },
        { route: "/courses", icon: BookOpen, label: "Courses" },
        { route: "/assignments", icon: ClipboardList, label: "Tasks" },
        { route: "/progress", icon: TrendingUp, label: "Progress" }
      ];
      
    case 'Call Center Agent':
      return [
        { route: "/callcenter", icon: LayoutDashboard, label: "Dashboard" },
        { route: "/callcenter/leads", icon: Target, label: "Leads" },
        { route: "/callcenter/voip", icon: Phone, label: "Calls" },
        { route: "/callcenter/performance", icon: BarChart3, label: "Stats" }
      ];
      
    case 'Mentor':
      return [
        { route: "/mentor", icon: Home, label: "Home" },
        { route: "/mentor/students", icon: Users, label: "Students" },
        { route: "/mentor/sessions", icon: Calendar, label: "Sessions" },
        { route: "/mentor/progress", icon: TrendingUp, label: "Progress" }
      ];
      
    case 'Accountant':
      return [
        { route: "/accountant", icon: LayoutDashboard, label: "Dashboard" },
        { route: "/accountant/payments", icon: DollarSign, label: "Payments" },
        { route: "/accountant/reports", icon: BarChart3, label: "Reports" },
        { route: "/accountant/compliance", icon: Shield, label: "Compliance" }
      ];
      
    default:
      return [
        { route: "/dashboard", icon: Home, label: "Home" },
        { route: "/courses", icon: BookOpen, label: "Courses" },
        { route: "/assignments", icon: ClipboardList, label: "Tasks" },
        { route: "/profile", icon: UserCheck, label: "Profile" }
      ];
  }
};

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) return null;
  
  const navigationItems = getRoleNavigation(user.role);
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-inset-bottom",
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
              onClick={() => setLocation(item.route)}
              className={cn(
                "bottom-nav-item touch-friendly relative",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 nav-icon" />
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