import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  Video,
  User,
  Bot
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation(['student', 'common']);
  const { user } = useAuth();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  if (user?.role?.toLowerCase() !== 'student') {
    return null;
  }

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: t('common:student.navigation.home', 'Home')
    },
    {
      path: '/student/courses',
      icon: <BookOpen className="h-5 w-5" />,
      label: t('common:student.navigation.courses', 'Courses')
    },
    {
      path: '/student/homework',
      icon: <MessageSquare className="h-5 w-5" />,
      label: t('common:student.navigation.homework', 'Homework')
    },
    {
      path: '/student/profile',
      icon: <User className="h-5 w-5" />,
      label: t('common:student.navigation.profile', 'Profile')
    }
  ];

  // For RTL languages, reverse items so the first item (Home) appears on the right
  const displayItems = isRTL ? [...navItems].reverse() : navItems;

  return (
    <div
      className="fixed bottom-0 start-0 end-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10"
      style={{ zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <nav className="flex justify-around items-stretch h-16 px-1">
        {displayItems.map((item) => {
          const isActive = location === item.path || 
                          (item.path === '/dashboard' && location === '/student/dashboard');
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-w-0 rounded-xl transition-all duration-200 tap-scale",
                isActive
                  ? "text-purple-400"
                  : "text-white/55 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <div className="relative mb-0.5">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 bg-purple-500/20 rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 transition-colors",
                  isActive ? "text-purple-400" : "text-white/55"
                )}>
                  {item.icon}
                </div>
              </div>
              <span
                className={cn(
                  "leading-tight text-center block w-full px-1 transition-colors",
                  "text-[10px]",
                  isActive ? "text-purple-400 font-semibold" : "text-white/55"
                )}
                style={{
                  fontFamily: isRTL ? "'Vazir', 'Tahoma', 'Arial', sans-serif" : undefined,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}