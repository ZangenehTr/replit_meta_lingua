"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ExpandableListProps<T = any> {
  items: T[]
  initialVisibleCount?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  itemClassName?: string
  buttonClassName?: string
  showMoreText?: string
  showLessText?: string
  variant?: 'default' | 'grid' | 'compact'
  animationDuration?: number
  animationStagger?: number
  showCounter?: boolean
  onExpand?: (expanded: boolean) => void
  compact?: boolean
  loading?: boolean
  loadingItems?: number
  renderSkeleton?: () => React.ReactNode
}

const variantStyles = {
  default: "space-y-3",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
  compact: "space-y-2"
}

export function ExpandableList<T>({
  items,
  initialVisibleCount = 3,
  renderItem,
  className,
  itemClassName,
  buttonClassName,
  showMoreText = "Show More",
  showLessText = "Show Less", 
  variant = 'default',
  animationDuration = 300,
  animationStagger = 50,
  showCounter = true,
  onExpand,
  compact = false,
  loading = false,
  loadingItems = 3,
  renderSkeleton,
  ...props
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasMoreItems = items.length > initialVisibleCount

  const handleToggle = React.useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpand?.(newExpanded)
  }, [isExpanded, onExpand])

  const visibleItems = isExpanded ? items : items.slice(0, initialVisibleCount)
  const hiddenCount = items.length - initialVisibleCount

  // Loading skeleton
  if (loading) {
    const skeletonCount = loadingItems || initialVisibleCount
    return (
      <div className={cn(variantStyles[variant], className)} {...props}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className={cn("animate-pulse", itemClassName)}>
            {renderSkeleton ? renderSkeleton() : (
              <div className="h-16 bg-muted rounded-lg" />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Items container */}
      <div className={cn(variantStyles[variant])}>
        <AnimatePresence initial={false}>
          {visibleItems.map((item, index) => (
            <motion.div
              key={index}
              layout
              initial={index >= initialVisibleCount ? { 
                opacity: 0, 
                y: 20,
                scale: 0.95 
              } : false}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1 
              }}
              exit={{ 
                opacity: 0, 
                y: -20,
                scale: 0.95 
              }}
              transition={{ 
                duration: animationDuration / 1000,
                delay: index >= initialVisibleCount ? (index - initialVisibleCount) * (animationStagger / 1000) : 0,
                ease: "easeOut"
              }}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More/Less button */}
      {hasMoreItems && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size={compact ? "sm" : "default"}
            onClick={handleToggle}
            className={cn(
              "touch-target text-muted-foreground hover:text-foreground transition-colors",
              "flex items-center gap-2",
              buttonClassName
            )}
            data-testid="expandable-list-toggle"
          >
            <span>
              {isExpanded ? showLessText : showMoreText}
              {showCounter && !isExpanded && hiddenCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 px-1.5 text-xs"
                >
                  +{hiddenCount}
                </Badge>
              )}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: animationDuration / 1000 }}
            >
              <ChevronDown className={cn(
                compact ? "h-3 w-3" : "h-4 w-4"
              )} />
            </motion.div>
          </Button>
        </div>
      )}

      {/* Optional counter display */}
      {showCounter && items.length > 0 && (
        <div className="text-center">
          <p className={cn(
            "text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            Showing {visibleItems.length} of {items.length} items
          </p>
        </div>
      )}
    </div>
  )
}

export type { ExpandableListProps }