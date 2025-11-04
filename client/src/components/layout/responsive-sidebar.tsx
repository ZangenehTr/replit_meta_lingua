import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, Home } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { getNavigationForRole } from "@/lib/role-based-navigation";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResponsiveSidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSidebarWidthChange?: (width: number) => void;
}

// Icon mapping (same as Sidebar component)
const iconMap = {
  Home, BookOpen: Home, Users: Home, Video: Home, ClipboardList: Home,
  MessageSquare: Home, TrendingUp: Home, CreditCard: Home, GraduationCap: Home,
  Calendar: Home, ClipboardCheck: Home, FileText: Home, BarChart: Home,
  Eye: Home, Phone: Home, Target: Home, Megaphone: Home, MessageCircle: Home,
  UserPlus: Home, Send: Home, DollarSign: Home, Building2: Home, Settings: Home,
  Globe: Home, Bot: Home, Map: Home, Gamepad2: Home, Play: Home, UserCog: Home,
  Share2: Home, UserCheck: Home, Workflow: Home, Shield: Home, ShoppingCart: Home,
  Book: Home, ShoppingBag: Home, Route: Home, File: Home, MapPin: Home,
  Volume2: Home, Box: Home, Plug: Home, CalendarDays: Home, Coins: Home,
  Type: Home // Add Type for font management
} as const;

export function ResponsiveSidebar({ mobileMenuOpen, setMobileMenuOpen, onSidebarWidthChange }: ResponsiveSidebarProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed on tablets
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();

  // Get navigation items for collapsed view
  const navigationItems = useMemo(() => {
    if (!user) return [];
    return getNavigationForRole(user.role, t, i18n.language);
  }, [user?.role, i18n.language, t]);

  // Notify parent of sidebar width changes
  useEffect(() => {
    const width = isCollapsed ? 64 : 256; // 16 = 4rem, 256 = 16rem in pixels
    onSidebarWidthChange?.(width);
  }, [isCollapsed, onSidebarWidthChange]);

  // Students don't use sidebar
  if (user?.role?.toLowerCase() === 'student') {
    return null;
  }

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Sheet Sidebar (<640px) */}
      <div className="sm:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-72 p-0 max-w-[75vw] z-[100]" 
            onPointerDownOutside={() => setMobileMenuOpen(false)}
            onEscapeKeyDown={() => setMobileMenuOpen(false)}
          >
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Tablet Collapsible Sidebar (640px-1024px) */}
      <aside className="hidden sm:block lg:hidden">
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 border-r border-border bg-background transition-all duration-300 z-40 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`sticky top-0 ${isCollapsed ? 'mx-auto mt-2' : 'absolute top-2 right-2'} z-50 h-8 w-8`}
            onClick={handleToggle}
            data-testid="sidebar-toggle-tablet"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {!isCollapsed && <Sidebar />}
          
          {/* Collapsed State - Show Icon-Only Navigation */}
          {isCollapsed && (
            <TooltipProvider>
              <div className="pt-4 px-2 space-y-2">
                {navigationItems.slice(0, 10).map((item, index) => {
                  const isActive = location === item.path;
                  const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Home;
                  
                  return (
                    <Tooltip key={`${item.path}-${index}`}>
                      <TooltipTrigger asChild>
                        <Link href={item.path}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`w-12 h-12 ${
                              isActive 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            data-testid={`sidebar-icon-${index}`}
                          >
                            <IconComponent className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>
      </aside>

      {/* Desktop Full Sidebar (>=1024px) */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0 order-first">
        <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 border-r border-border bg-background">
          <Sidebar />
        </div>
      </aside>
    </>
  );
}
