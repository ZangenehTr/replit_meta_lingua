"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ExpandableCardProps {
  title: string
  description?: string
  children: React.ReactNode
  expandedContent?: React.ReactNode
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  headerClassName?: string
  contentClassName?: string
  expandedClassName?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  actions?: React.ReactNode
  disabled?: boolean
  compact?: boolean
  showExpandButton?: boolean
  expandButtonText?: string
  collapseButtonText?: string
  animationDuration?: number
  maxCollapsedHeight?: string
}

const sizeConfig = {
  sm: {
    padding: "p-3",
    titleSize: "text-sm",
    descriptionSize: "text-xs",
    iconSize: "h-4 w-4",
    buttonSize: "h-8"
  },
  md: {
    padding: "p-4",
    titleSize: "text-base", 
    descriptionSize: "text-sm",
    iconSize: "h-5 w-5",
    buttonSize: "h-9"
  },
  lg: {
    padding: "p-6",
    titleSize: "text-lg",
    descriptionSize: "text-base", 
    iconSize: "h-6 w-6",
    buttonSize: "h-10"
  }
}

export function ExpandableCard({
  title,
  description,
  children,
  expandedContent,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  variant = 'default',
  size = 'md',
  className,
  headerClassName,
  contentClassName,
  expandedClassName,
  icon: Icon,
  badge,
  actions,
  disabled = false,
  compact = false,
  showExpandButton = true,
  expandButtonText = "Show More",
  collapseButtonText = "Show Less",
  animationDuration = 300,
  maxCollapsedHeight = "150px",
  ...props
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const isControlled = expanded !== undefined
  const currentExpanded = isControlled ? expanded : isExpanded

  const handleExpandedChange = React.useCallback((newExpanded: boolean) => {
    if (disabled) return
    
    if (isControlled) {
      onExpandedChange?.(newExpanded)
    } else {
      setIsExpanded(newExpanded)
    }
  }, [disabled, isControlled, onExpandedChange])

  const currentSize = compact ? 'sm' : size
  const config = sizeConfig[currentSize]

  // Determine if content needs truncation
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [needsTruncation, setNeedsTruncation] = React.useState(false)

  React.useEffect(() => {
    if (contentRef.current && !currentExpanded) {
      const element = contentRef.current
      setNeedsTruncation(element.scrollHeight > parseInt(maxCollapsedHeight))
    }
  }, [children, maxCollapsedHeight, currentExpanded])

  return (
    <Card 
      className={cn("overflow-hidden", className)}
      data-testid="expandable-card"
      {...props}
    >
      <CardHeader className={cn(config.padding, "pb-2", headerClassName)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {Icon && (
              <Icon className={cn(config.iconSize, "shrink-0 mt-0.5")} />
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className={cn(config.titleSize, "line-clamp-2")}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className={cn(
                  config.descriptionSize,
                  "mt-1 line-clamp-2"
                )}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {badge && badge}
            {actions && actions}
            {showExpandButton && (expandedContent || needsTruncation) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExpandedChange(!currentExpanded)}
                disabled={disabled}
                className={cn(
                  "touch-target shrink-0",
                  config.buttonSize,
                  "px-2"
                )}
                data-testid="expand-toggle-button"
              >
                <motion.div
                  animate={{ rotate: currentExpanded ? 180 : 0 }}
                  transition={{ duration: animationDuration / 1000 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(config.padding, "pt-0", contentClassName)}>
        {/* Main content with optional height constraint */}
        <motion.div
          ref={contentRef}
          animate={{
            height: currentExpanded ? "auto" : maxCollapsedHeight
          }}
          transition={{ 
            duration: animationDuration / 1000,
            ease: "easeInOut"
          }}
          className={cn(
            "overflow-hidden",
            !currentExpanded && "relative"
          )}
        >
          {children}
          
          {/* Gradient overlay for truncated content */}
          {!currentExpanded && needsTruncation && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </motion.div>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {currentExpanded && expandedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: animationDuration / 1000,
                ease: "easeInOut"
              }}
              className={cn(
                "overflow-hidden border-t border-border/50 mt-3 pt-3",
                expandedClassName
              )}
            >
              {expandedContent}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show More/Less button at bottom */}
        {showExpandButton && (expandedContent || needsTruncation) && (
          <div className="flex justify-center mt-3 pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExpandedChange(!currentExpanded)}
              disabled={disabled}
              className="touch-target text-muted-foreground hover:text-foreground"
              data-testid="expand-button"
            >
              {currentExpanded ? collapseButtonText : expandButtonText}
              <motion.div
                animate={{ rotate: currentExpanded ? 180 : 0 }}
                transition={{ duration: animationDuration / 1000 }}
                className="ml-1"
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { ExpandableCardProps }