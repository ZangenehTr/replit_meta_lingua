import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  gradient?: 'primary' | 'secondary' | 'success' | 'warm' | 'cool' | 'dark' | 'study' | 'focus';
  className?: string;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  showNotifications = true,
  showSettings = false,
  gradient = 'primary',
  className
}: MobileLayoutProps) {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa';

  const gradientClasses: Record<string, string> = {
    primary: 'mobile-gradient-primary',
    secondary: 'mobile-gradient-secondary',
    success: 'mobile-gradient-success',
    warm: 'mobile-gradient-warm',
    cool: 'mobile-gradient-cool',
    dark: 'mobile-gradient-dark',
    study: 'mobile-gradient-study',
    focus: 'mobile-gradient-focus',
  };

  return (
    <div className={cn(gradientClasses[gradient] ?? 'mobile-gradient-primary', 'min-h-screen flex flex-col', className)}>
      {/* Mobile Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="mobile-header top-safe-area px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => window.history.back()}
                className="tap-scale p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className={cn("h-5 w-5 text-gray-700", isRTL && "rotate-180")} />
              </button>
            )}
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showNotifications && (
              <button className="tap-scale p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Bell className="h-5 w-5 text-gray-700" />
                <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}
            {showSettings && (
              <button 
                onClick={() => navigate('/student/profile')}
                className="tap-scale p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 mobile-scroll px-3 pt-2 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={gradient}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
