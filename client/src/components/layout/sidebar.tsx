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
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
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
  Gamepad2: Home, // Using Home as fallback for Gamepad2
  Play: Video, // Using Video as fallback for Play
  UserCog: Users, // Using Users as fallback for UserCog
  Share2: TrendingUp // Using TrendingUp as fallback for Share2
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();
  
  // Get navigation items based on user role according to PRD specifications
  const navigationItems = user ? getNavigationForRole(user.role, t) : [];

  return (
    <aside className={`w-64 md:w-72 lg:w-80 bg-white dark:bg-gray-800 ${isRTL ? 'border-l border-gray-200 dark:border-gray-700' : 'border-r border-gray-200 dark:border-gray-700'} fixed h-full overflow-y-auto hidden md:block ${isRTL ? 'right-0' : 'left-0'} z-40`}>
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto" variant="secondary">
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
