import { 
  Home, 
  BookOpen, 
  Users, 
  Video, 
  ClipboardList, 
  MessageSquare, 
  TrendingUp, 
  CreditCard, 
  User,
  Settings,
  LogOut,
  Building2,
  UserPlus,
  Send,
  DollarSign,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  BarChart,
  Eye,
  Phone,
  Target,
  Megaphone,
  MessageCircle,
  Globe,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Link, useLocation } from "wouter";
import { getNavigationForRole } from "@/lib/role-based-navigation";

const iconMap = {
  Home,
  BookOpen,
  Users,
  Video,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  CreditCard,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  BarChart,
  Eye,
  Phone,
  Target,
  Megaphone,
  MessageCircle,
  UserPlus,
  Send,
  DollarSign,
  Building2,
  Settings,
  Globe,
  Bot,
  Gamepad2: Home, // Using Home as fallback for Gamepad2
  Play: Video, // Using Video as fallback for Play
  UserCog: Users, // Using Users as fallback for UserCog
  Share2: TrendingUp // Using TrendingUp as fallback for Share2
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common', 'admin', 'teacher', 'student', 'mentor', 'supervisor', 'callcenter', 'accountant']);
  const { isRTL } = useLanguage();
  const [location, setLocation] = useLocation();
  
  // Get navigation items based on user role according to PRD specifications
  const navigationItems = user ? getNavigationForRole(user.role, t) : [];

  return (
    <aside className={`w-64 md:w-64 lg:w-72 xl:w-80 bg-white dark:bg-gray-800 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700 fixed top-14 ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-3.5rem)] overflow-y-auto z-30`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-6">
        <nav className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'} ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    setLocation(item.path);
                    onNavigate?.();
                  }}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <Icon className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</span>
                  {item.badge && (
                    <Badge className={isRTL ? 'mr-auto' : 'ml-auto'} variant="secondary">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
        
        {/* Profile section removed - handled by global header dropdown to eliminate redundancy */}
      </div>
    </aside>
  );
}
