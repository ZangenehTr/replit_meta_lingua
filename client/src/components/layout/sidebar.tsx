import React, { useState, useEffect } from 'react';
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
  Bot,
  Map,
  ShoppingCart,
  Book,
  ShoppingBag,
  Route,
  File,
  MapPin,
  Volume2,
  Box,
  Plug,
  CalendarDays,
  Coins,
  Gamepad2,
  Play,
  UserCog,
  Share2,
  UserCheck,
  Workflow,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Link, useLocation } from "wouter";
import { getNavigationForRole, getRoleColor, getRoleColors } from "@/lib/role-based-navigation";

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
  Map,
  Gamepad2,
  Play,
  UserCog,
  Share2,
  UserCheck,
  Workflow,
  Shield,
  // New subsystem icons
  ShoppingCart,
  Book,
  ShoppingBag,
  Route,
  File,
  MapPin,
  Volume2,
  Box,
  Plug,
  CalendarDays,
  Coins,
  // Additional icon mappings for variations
  VideoIcon: Video,
  FileDownload: FileText,
  Layers: Box,
  Settings2: Settings,
  PlusCircle: UserPlus,
  Database: Building2
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isRTL, setIsRTL] = useState(['fa', 'ar'].includes(language));

  useEffect(() => {
    setIsRTL(['fa', 'ar'].includes(language));
  }, [language]);
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();

  // Students should not have a sidebar - they use mobile bottom navigation
  if (user?.role?.toLowerCase() === 'student') {
    return null;
  }

  // Use react-i18next translation function with correct namespace
  const navigationItems = user ? getNavigationForRole(user.role, t) : [];

  console.log('Sidebar rendering with items:', navigationItems.length, 'items');
  console.log('Callern items:', navigationItems.filter(item => item.path.includes('callern')));
  
  // Prevent sidebar scroll on navigation
  const handleNavigate = (path: string) => {
    const sidebar = document.querySelector('.sidebar-container');
    const currentScroll = sidebar?.scrollTop || 0;
    
    setLocation(path);
    onNavigate?.();
    
    // Restore scroll position after navigation
    requestAnimationFrame(() => {
      if (sidebar) {
        sidebar.scrollTop = currentScroll;
      }
    });
  };

  return (
    <div className={`sidebar-container w-full h-full bg-white dark:bg-gray-800 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-4">
        <nav className="space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {navigationItems.map((item, index) => {
            const isActive = location === item.path;
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
            const roleColors = getRoleColors(item.roles);
            const hasMultipleRoles = roleColors.length > 1;

            return (
              <Link key={`${item.path}-${index}`} href={item.path}>
                <Button
                  variant="ghost"
                  className={`w-full h-10 ${isRTL ? 'justify-end flex-row-reverse px-3' : 'justify-start px-3'} ${
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  } relative`}
                  onClick={() => {
                    handleNavigate(item.path);
                  }}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  {/* Multi-role color indicators */}
                  {hasMultipleRoles ? (
                    <div className={`absolute ${isRTL ? 'right-1' : 'left-1'} top-1/2 -translate-y-1/2 flex flex-col gap-0.5`}>
                      {roleColors.map((color, idx) => (
                        <span key={idx} className={`w-1 h-2 rounded-full ${color}`}></span>
                      ))}
                    </div>
                  ) : (
                    <span className={`absolute ${isRTL ? 'right-1' : 'left-1'} top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${roleColors[0]}`}></span>
                  )}
                  
                  <Icon className={`h-4 w-4 ${isRTL ? 'ml-3 mr-3' : 'mr-3 ml-3'}`} />
                  <span className={isRTL ? 'flex-1 text-right' : ''}>{item.label}</span>
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
    </div>
  );
}