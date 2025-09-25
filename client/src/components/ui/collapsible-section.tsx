"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'outlined' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  disabled?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  triggerClassName?: string
  compact?: boolean
  showIndicator?: boolean
  animationDuration?: number
}

const variantStyles = {
  default: "border border-border rounded-lg",
  outlined: "border-2 border-border rounded-lg",
  ghost: "border-0"
}

const sizeStyles = {
  sm: {
    padding: "p-3",
    titleSize: "text-sm",
    iconSize: "h-4 w-4"
  },
  md: {
    padding: "p-4", 
    titleSize: "text-base",
    iconSize: "h-5 w-5"
  },
  lg: {
    padding: "p-6",
    titleSize: "text-lg", 
    iconSize: "h-6 w-6"
  }
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = 'default',
  size = 'md',
  icon: Icon,
  badge,
  disabled = false,
  className,
  headerClassName,
  contentClassName,
  triggerClassName,
  compact = false,
  showIndicator = true,
  animationDuration = 200,
  ...props
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : isOpen

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (disabled) return
    
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }, [disabled, isControlled, onOpenChange])

  const currentSize = compact ? 'sm' : size
  const styles = sizeStyles[currentSize]

  return (
    <CollapsiblePrimitive.Root 
      open={currentOpen}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      className={cn(variantStyles[variant], className)}
      data-testid="collapsible-section"
      {...props}
    >
      <CollapsiblePrimitive.Trigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between font-medium hover:bg-muted/50 transition-colors touch-target",
            styles.padding,
            "h-auto min-h-[44px]", // Ensure minimum touch target
            disabled && "opacity-50 cursor-not-allowed",
            headerClassName,
            triggerClassName
          )}
          disabled={disabled}
          data-testid="collapsible-trigger"
        >
          <div className="flex items-center gap-2 flex-1 text-left">
            {Icon && (
              <Icon className={cn(styles.iconSize, "shrink-0")} />
            )}
            <span className={cn(styles.titleSize, "truncate")}>
              {title}
            </span>
            {badge && (
              <div className="ml-auto mr-2">
                {badge}
              </div>
            )}
          </div>
          {showIndicator && (
            <motion.div
              animate={{ rotate: currentOpen ? 180 : 0 }}
              transition={{ duration: animationDuration / 1000 }}
              className="shrink-0"
            >
              <ChevronDown className={cn(
                compact ? "h-4 w-4" : "h-5 w-5"
              )} />
            </motion.div>
          )}
        </Button>
      </CollapsiblePrimitive.Trigger>

      <AnimatePresence initial={false}>
        {currentOpen && (
          <CollapsiblePrimitive.Content forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: animationDuration / 1000,
                ease: "easeInOut"
              }}
              className="overflow-hidden"
            >
              <div className={cn(
                styles.padding,
                "pt-0 border-t border-border/50",
                contentClassName
              )}>
                {children}
              </div>
            </motion.div>
          </CollapsiblePrimitive.Content>
        )}
      </AnimatePresence>
    </CollapsiblePrimitive.Root>
  )
}

export type { CollapsibleSectionProps }