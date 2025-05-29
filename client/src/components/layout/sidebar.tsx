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
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link, useLocation } from "wouter";

const getNavigationItems = (t: any) => [
  { path: "/dashboard", icon: Home, label: t('myDashboard') },
  { path: "/courses", icon: BookOpen, label: t('myCourses') },
  { path: "/tutors", icon: Users, label: t('findTutors') },
  { path: "/sessions", icon: Video, label: t('liveSessions') },
  { path: "/homework", icon: ClipboardList, label: t('homework'), badge: 2 },
  { path: "/messages", icon: MessageSquare, label: t('messages'), badge: 5 },
  { path: "/progress", icon: TrendingUp, label: t('progress') },
  { path: "/payment", icon: CreditCard, label: t('paymentCredits') },
];

export function Sidebar() {
  const { logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();
  const navigationItems = getNavigationItems(t);

  return (
    <aside className={`w-64 bg-white dark:bg-gray-800 ${isRTL ? 'border-l border-gray-200 dark:border-gray-700' : 'border-r border-gray-200 dark:border-gray-700'} fixed h-full overflow-y-auto hidden md:block ${isRTL ? 'right-0' : 'left-0'}`}>
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
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
                  <Icon className="mr-3 h-4 w-4" />
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
        
        <Separator className="my-6" />
        
        <div className="space-y-2">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
              <User className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
              <span>{t('profile')}</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
              <span>{t('settings')}</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => {
              localStorage.removeItem("auth_token");
              window.location.href = "/auth";
            }}
          >
            <LogOut className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <span>{t('signOut')}</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
