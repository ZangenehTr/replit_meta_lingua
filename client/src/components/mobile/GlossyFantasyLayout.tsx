import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Search, Menu } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { MobileBottomNav } from './MobileBottomNav';

interface GlossyFantasyLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showBottomNav?: boolean;
  headerActions?: ReactNode;
  className?: string;
}

export function GlossyFantasyLayout({
  children,
  title,
  showBack = false,
  showSearch = false,
  showNotifications = true,
  showBottomNav = true,
  headerActions,
  className = ''
}: GlossyFantasyLayoutProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <div className={`mobile-fantasy-container ${className}`}>
      {/* Animated AI Fantasy Background */}
      <div className="ai-fantasy-bg" />
      
      {/* Mobile Header */}
      <motion.header 
        className="mobile-fantasy-header glass-card"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => window.history.back()}
                className="p-2 rounded-full glass-button"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            ) : (
              <div className="avatar-fantasy">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {title && (
              <h1 className="text-white font-bold text-lg holographic">
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showSearch && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full glass-button"
              >
                <Search className="w-5 h-5 text-white" />
              </motion.button>
            )}
            
            {showNotifications && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full glass-button relative"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </motion.button>
            )}
            
            {headerActions}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="mobile-fantasy-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {children}
      </motion.main>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

// Glossy Card Component
interface GlossyCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function GlossyCard({ 
  children, 
  className = '', 
  onClick,
  interactive = false 
}: GlossyCardProps) {
  const Component = interactive ? motion.div : 'div';
  const props = interactive ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400 }
  } : {};

  return (
    <Component
      className={`glass-card ${interactive ? 'interactive-card touch-ripple' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
}

// Glossy Button Component
interface GlossyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GlossyButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = ''
}: GlossyButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    success: 'bg-gradient-to-r from-green-500 to-teal-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        glass-button touch-ripple
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

// Progress Bar Component
interface GlossyProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function GlossyProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  className = ''
}: GlossyProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-white/70">{label}</span>}
          {showPercentage && <span className="text-white/70">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="ai-progress-bar">
        <motion.div 
          className="ai-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'purple' | 'blue' | 'pink' | 'cyan' | 'green' | 'orange';
  onClick?: () => void;
}

export function StatCard({
  icon,
  label,
  value,
  subValue,
  color = 'purple',
  onClick
}: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    pink: 'from-pink-400 to-pink-600',
    cyan: 'from-cyan-400 to-cyan-600',
    green: 'from-green-400 to-green-600',
    orange: 'from-orange-400 to-orange-600'
  };

  return (
    <GlossyCard interactive onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-white/70 text-sm">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subValue && <p className="text-white/50 text-xs">{subValue}</p>}
        </div>
      </div>
    </GlossyCard>
  );
}

// List Item Component
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightContent?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightContent,
  onClick,
  className = ''
}: ListItemProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`list-item-fantasy ${className}`}
      onClick={onClick}
    >
      {leftIcon && (
        <div className="mr-3 text-white/80">
          {leftIcon}
        </div>
      )}
      
      <div className="flex-1">
        <p className="text-white font-medium">{title}</p>
        {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
      </div>
      
      {rightContent && (
        <div className="text-white/60">
          {rightContent}
        </div>
      )}
    </motion.div>
  );
}

// Tab Component
interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface GlossyTabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function GlossyTabs({
  items,
  activeTab,
  onTabChange,
  className = ''
}: GlossyTabsProps) {
  return (
    <div className={`tab-fantasy ${className}`}>
      {items.map((item) => (
        <motion.button
          key={item.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTabChange(item.id)}
          className={`tab-fantasy-item ${activeTab === item.id ? 'active' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Badge Component
interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    success: 'bg-gradient-to-r from-green-500 to-teal-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`badge-fantasy ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

// Floating Action Button
interface FABProps {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}

export function FAB({ icon, onClick, className = '' }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`fab-fantasy ${className}`}
    >
      {icon}
    </motion.button>
  );
}