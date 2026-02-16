import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
  Server,
  ChevronDown,
  ChevronRight
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
  Server,
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
  collapsed?: boolean;
}

export function Sidebar({ onNavigate, collapsed = false }: SidebarProps = {}) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isRTL, setIsRTL] = useState(['fa', 'ar'].includes(language));

  useEffect(() => {
    setIsRTL(['fa', 'ar'].includes(language));
  }, [language]);
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();

  // Students should not have a sidebar - they use mobile bottom navigation
  if (user?.role?.toLowerCase() === 'student') {
    return null;
  }

  // Use react-i18next translation function with correct namespace
  // Memoize navigation items with dependencies on user role AND i18n language
  // This ensures the navigation regenerates when language changes (fixing i18n issue)
  const navigationItems = useMemo(() => {
    if (!user) return [];
    return getNavigationForRole(user.role, t, i18n.language);
  }, [user?.role, i18n.language, t]);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const MIN_ITEMS_FOR_GROUPING = 8;

  const groupedNavigation = useMemo(() => {
    if (navigationItems.length < MIN_ITEMS_FOR_GROUPING) return null;
    
    const hasSections = navigationItems.some(item => item.section);
    if (!hasSections) return null;
    
    const groups: Record<string, typeof navigationItems> = {};
    const sectionOrder = [
      "Dashboard",
      "Student", "Teacher/Tutor", "Mentor", "Call Center Agent", "Front Desk Clerk", "Supervisor",
      "Teaching", "Content & Reports",
      "Reception", "Scheduling",
      "People & Access", "Courses & Academics", "Games & Interactive",
      "AI & Technology", "Call Center", "Communication", "Financial",
      "Website & Content", "Analytics & Quality", "System & Settings",
      "Mentoring",
      "Other"
    ];
    
    navigationItems.forEach(item => {
      const section = item.section || "Other";
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
    });
    
    const orderedSections = Object.keys(groups).sort((a, b) => {
      const indexA = sectionOrder.indexOf(a);
      const indexB = sectionOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return 1;
      return indexA - indexB;
    });
    
    return orderedSections.map(section => ({
      section,
      items: groups[section]
    }));
  }, [navigationItems]);

  console.log('Sidebar rendering with items:', navigationItems.length, 'items');
  console.log('Callern items:', navigationItems.filter(item => item.path.includes('callern')));
  
  // Restore scroll position from localStorage on mount and save on scroll
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-container');
    if (!sidebar) return;

    // Restore scroll position from localStorage
    const savedScroll = localStorage.getItem('sidebar-scroll-position');
    if (savedScroll) {
      sidebar.scrollTop = parseInt(savedScroll, 10);
    }

    // Save scroll position to localStorage on scroll
    const handleScroll = () => {
      localStorage.setItem('sidebar-scroll-position', sidebar.scrollTop.toString());
    };

    sidebar.addEventListener('scroll', handleScroll);
    return () => sidebar.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Prevent sidebar scroll jump on navigation
  const handleNavigate = (path: string) => {
    const sidebar = document.querySelector('.sidebar-container');
    const currentScroll = sidebar?.scrollTop || 0;
    
    // Save to localStorage before navigation
    if (currentScroll) {
      localStorage.setItem('sidebar-scroll-position', currentScroll.toString());
    }
    
    setLocation(path);
    onNavigate?.();
    
    // Restore scroll position after navigation
    requestAnimationFrame(() => {
      if (sidebar) {
        sidebar.scrollTop = currentScroll;
      }
    });
  };

  const getSectionLabelFa = (section: string): string => {
    const labels: Record<string, string> = {
      "Dashboard": "داشبورد",
      "Student": "پلتفرم دانش‌آموز",
      "Teacher/Tutor": "پلتفرم معلم",
      "Mentor": "پلتفرم منتور",
      "Call Center Agent": "مرکز تماس",
      "Front Desk Clerk": "پذیرش",
      "Supervisor": "ناظر",
      "People & Access": "افراد و دسترسی",
      "Courses & Academics": "دوره‌ها و آموزش",
      "Games & Interactive": "بازی و تعاملی",
      "AI & Technology": "هوش مصنوعی و فناوری",
      "Communication": "ارتباطات",
      "Financial": "مالی",
      "Website & Content": "وبسایت و محتوا",
      "Analytics & Quality": "تحلیل و کیفیت",
      "System & Settings": "سیستم و تنظیمات",
      "Teaching": "تدریس",
      "Content & Reports": "محتوا و گزارش",
      "Call Center": "مرکز تماس",
      "Reception": "پذیرش",
      "Scheduling": "برنامه‌ریزی",
      "Mentoring": "منتورینگ",
      "Other": "سایر",
    };
    return labels[section] || section;
  };

  return (
    <div className={`sidebar-container w-full h-full bg-white dark:bg-gray-800 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={collapsed ? 'p-2' : 'p-4'}>
        <nav className="space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {groupedNavigation ? (
            groupedNavigation.map(({ section, items }) => {
              const isCollapsed = collapsedSections[section] ?? false;
              const sectionLabel = i18n.language === 'fa' ? getSectionLabelFa(section) : section;
              
              return (
                <div key={section} className="mb-1">
                  {!collapsed && (
                    <button
                      onClick={() => toggleSection(section)}
                      className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors`}
                    >
                      {isCollapsed ? (
                        <ChevronRight className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      ) : (
                        <ChevronDown className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      )}
                      <span>{sectionLabel}</span>
                      <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-[10px] text-gray-400`}>
                        {items.length}
                      </span>
                    </button>
                  )}
                  
                  {!isCollapsed && items.map((item, index) => {
                    const isActive = location === item.path;
                    const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
                    const roleColors = getRoleColors(item.roles);
                    const hasMultipleRoles = roleColors.length > 1;

                    if (collapsed) {
                      return (
                        <Link key={`${item.path}-${index}`} href={item.path}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`w-full h-10 ${
                              isActive 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            } relative flex items-center justify-center`}
                            onClick={() => handleNavigate(item.path)}
                            title={item.label}
                            aria-label={item.label}
                          >
                            {isAdmin && (
                              <span 
                                className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full ${roleColors[0]}`}
                                title={`${item.roles?.join(', ')}`}
                              ></span>
                            )}
                            <Icon className="h-5 w-5" />
                          </Button>
                        </Link>
                      );
                    }

                    return (
                      <Link key={`${item.path}-${index}`} href={item.path}>
                        <Button
                          variant="ghost"
                          className={`w-full h-10 ${isRTL ? 'justify-end flex-row-reverse px-3' : 'justify-start px-3'} ${
                            isActive 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          } relative`}
                          onClick={() => handleNavigate(item.path)}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          title={`${t('sidebar:availableFor', 'دسترسی برای')}: ${item.roles?.join(', ')}`}
                        >
                          {hasMultipleRoles ? (
                            <div className={`absolute ${isRTL ? 'right-1' : 'left-1'} top-1/2 -translate-y-1/2 flex flex-col gap-0.5`}>
                              {roleColors.slice(0, 3).map((color, idx) => (
                                <span key={idx} className={`w-0.5 h-2 rounded-full ${color}`}></span>
                              ))}
                            </div>
                          ) : (
                            <span className={`absolute ${isRTL ? 'right-1' : 'left-1'} top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full ${roleColors[0]}`}></span>
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
                </div>
              );
            })
          ) : (
            navigationItems.map((item, index) => {
              const isActive = location === item.path;
              const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
              const roleColors = getRoleColors(item.roles);
              const hasMultipleRoles = roleColors.length > 1;

              if (collapsed) {
                return (
                  <Link key={`${item.path}-${index}`} href={item.path}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-full h-10 ${
                        isActive 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      } relative flex items-center justify-center`}
                      onClick={() => handleNavigate(item.path)}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </Link>
                );
              }

              return (
                <Link key={`${item.path}-${index}`} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full h-10 ${isRTL ? 'justify-end flex-row-reverse px-3' : 'justify-start px-3'} ${
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } relative`}
                    onClick={() => handleNavigate(item.path)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  >
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
            })
          )}
        </nav>

        {/* Profile section removed - handled by global header dropdown to eliminate redundancy */}
      </div>
    </div>
  );
}