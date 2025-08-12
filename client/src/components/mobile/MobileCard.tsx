import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  dark?: boolean;
  animated?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function MobileCard({
  children,
  className,
  glass = true,
  dark = false,
  animated = true,
  delay = 0,
  onClick
}: MobileCardProps) {
  const cardContent = (
    <div
      className={cn(
        glass ? (dark ? 'glass-card-dark' : 'glass-card') : '',
        'p-5 rounded-2xl transition-all duration-300',
        onClick && 'tap-scale cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

export function MobileCardHeader({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function MobileCardTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

export function MobileCardContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}