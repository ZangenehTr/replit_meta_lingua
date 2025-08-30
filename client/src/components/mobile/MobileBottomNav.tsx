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
  User
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Only show mobile navigation for students
  if (user?.role?.toLowerCase() !== 'student') {
    return null;
  }

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: t('student.navigation.home')
    },
    {
      path: '/student/courses',
      icon: <BookOpen className="h-5 w-5" />,
      label: t('student.navigation.courses')
    },
    {
      path: '/callern',
      icon: <Video className="h-5 w-5" />,
      label: t('student.navigation.callern')
    },
    {
      path: '/student/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      label: t('student.navigation.messages')
    },
    {
      path: '/student/profile',
      icon: <User className="h-5 w-5" />,
      label: t('student.navigation.profile')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 bottom-safe-area z-50">
      <nav className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
                          (item.path === '/dashboard' && location === '/student/dashboard');
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 tap-scale rounded-lg transition-all duration-200",
                "hover:bg-gray-50",
                isActive && "text-purple-600"
              )}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 bg-purple-100 rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 transition-colors",
                  isActive ? "text-purple-600" : "text-gray-600"
                )}>
                  {item.icon}
                </div>
              </div>
              <span className={cn(
                "text-xs mt-1 transition-colors",
                isActive ? "text-purple-600 font-medium" : "text-gray-600"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}