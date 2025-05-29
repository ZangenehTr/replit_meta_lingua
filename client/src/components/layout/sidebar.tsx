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
import { Link, useLocation } from "wouter";

const navigationItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/courses", icon: BookOpen, label: "My Courses" },
  { path: "/tutors", icon: Users, label: "Find Tutors" },
  { path: "/sessions", icon: Video, label: "Live Sessions" },
  { path: "/homework", icon: ClipboardList, label: "Homework", badge: 2 },
  { path: "/messages", icon: MessageSquare, label: "Messages", badge: 5 },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/payment", icon: CreditCard, label: "Payment & Credits" },
];

export function Sidebar() {
  const { logout } = useAuth();
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full overflow-y-auto hidden md:block">
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
              <User className="mr-3 h-4 w-4" />
              <span>Profile</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-3 h-4 w-4" />
              <span>Settings</span>
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
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
