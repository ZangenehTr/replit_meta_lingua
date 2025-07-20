import { useState } from "react";
import { Menu, X, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { Link, useLocation } from "wouter";
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
  Settings
} from "lucide-react";

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

export function MobileNav() {
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'fa' as const, name: 'فارسی', flag: '🇮🇷' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ML</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Meta Lingua</h1>
                  <p className="text-xs text-muted-foreground">Language Learning</p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setOpen(false)}
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
            
            {/* Language Selector Section */}
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2 px-2">Language</p>
              <div className="space-y-1">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setLanguage(lang.code);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-3 text-lg">{lang.flag}</span>
                    <span className={lang.code === 'fa' || lang.code === 'ar' ? 'font-arabic' : ''}>{lang.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setOpen(false)}
                >
                  <User className="mr-3 h-4 w-4" />
                  <span>Profile</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}