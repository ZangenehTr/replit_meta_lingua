"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface EnhancedSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'list' | 'widget'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
  lines?: number
  aspectRatio?: string
  compact?: boolean
  children?: React.ReactNode
}

const skeletonVariants = {
  text: "h-4 rounded",
  circular: "rounded-full",
  rectangular: "rounded-md",
  card: "rounded-lg border",
  list: "rounded-lg",
  widget: "rounded-lg border shadow-sm"
}

const animationVariants = {
  pulse: {
    animate: {
      opacity: [0.4, 0.8, 0.4],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  wave: {
    animate: {
      x: ["-100%", "100%"],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  },
  none: {}
}

export function EnhancedSkeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
  lines = 1,
  aspectRatio,
  compact = false,
  ...props
}: EnhancedSkeletonProps) {
  const baseClasses = cn(
    "bg-muted animate-pulse",
    skeletonVariants[variant],
    className
  )

  const style: React.CSSProperties = {
    width,
    height,
    aspectRatio
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              baseClasses,
              index === lines - 1 && "w-3/4" // Make last line shorter
            )}
            style={index === lines - 1 ? { ...style, width: "75%" } : style}
            {...(animation !== 'none' && animationVariants[animation])}
          />
        ))}
      </div>
    )
  }

  if (animation === 'wave') {
    return (
      <div className={cn("relative overflow-hidden", baseClasses)} style={style} {...props}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          {...animationVariants.wave}
        />
      </div>
    )
  }

  return (
    <motion.div
      className={baseClasses}
      style={style}
      {...(animation !== 'none' && animationVariants[animation])}
      {...props}
    />
  )
}

// Pre-configured skeleton components for common use cases
export function SkeletonCard({ compact = false, ...props }: { compact?: boolean } & Omit<EnhancedSkeletonProps, 'variant'>) {
  return (
    <EnhancedSkeleton
      variant="card"
      className={cn(compact ? "p-3" : "p-4")}
      {...props}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <EnhancedSkeleton 
            variant="circular" 
            width={compact ? 32 : 40} 
            height={compact ? 32 : 40}
          />
          <div className="space-y-2 flex-1">
            <EnhancedSkeleton variant="text" width="60%" height={compact ? 12 : 16} />
            <EnhancedSkeleton variant="text" width="40%" height={compact ? 10 : 12} />
          </div>
        </div>
        <EnhancedSkeleton variant="text" lines={2} height={compact ? 10 : 12} />
        <div className="flex gap-2">
          <EnhancedSkeleton variant="rectangular" width={60} height={24} />
          <EnhancedSkeleton variant="rectangular" width={80} height={24} />
        </div>
      </div>
    </EnhancedSkeleton>
  )
}

export function SkeletonList({ 
  items = 3, 
  compact = false, 
  ...props 
}: { 
  items?: number; 
  compact?: boolean;
} & Omit<EnhancedSkeletonProps, 'variant'>) {
  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3")} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div 
          key={index}
          className={cn(
            "flex items-center gap-3 border rounded-lg",
            compact ? "p-2" : "p-3"
          )}
        >
          <EnhancedSkeleton 
            variant="rectangular" 
            width={compact ? 12 : 16} 
            height={compact ? 12 : 16}
          />
          <div className="flex-1 space-y-1">
            <EnhancedSkeleton variant="text" width="70%" height={compact ? 12 : 14} />
            <EnhancedSkeleton variant="text" width="50%" height={compact ? 10 : 12} />
          </div>
          <EnhancedSkeleton variant="rectangular" width={60} height={compact ? 20 : 24} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonWidget({ 
  title = true, 
  compact = false, 
  ...props 
}: { 
  title?: boolean; 
  compact?: boolean; 
} & Omit<EnhancedSkeletonProps, 'variant'>) {
  return (
    <EnhancedSkeleton
      variant="widget"
      className={cn(compact ? "p-3" : "p-4")}
      {...props}
    >
      <div className="space-y-4">
        {title && (
          <div className="flex items-center gap-2">
            <EnhancedSkeleton 
              variant="rectangular" 
              width={compact ? 16 : 20} 
              height={compact ? 16 : 20}
            />
            <EnhancedSkeleton variant="text" width="40%" height={compact ? 14 : 16} />
          </div>
        )}
        
        <div className={cn(compact ? "space-y-2" : "space-y-3")}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <EnhancedSkeleton variant="text" width="60%" height={compact ? 12 : 14} />
                <EnhancedSkeleton variant="text" width="40%" height={compact ? 10 : 12} />
              </div>
              <EnhancedSkeleton variant="rectangular" width={50} height={compact ? 20 : 24} />
            </div>
          ))}
        </div>
        
        <div className="border-t pt-2">
          <EnhancedSkeleton variant="text" width="30%" height={compact ? 10 : 12} />
        </div>
      </div>
    </EnhancedSkeleton>
  )
}

export type { EnhancedSkeletonProps }