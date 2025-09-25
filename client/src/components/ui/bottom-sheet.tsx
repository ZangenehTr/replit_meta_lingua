"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BottomSheetProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  className?: string
  contentClassName?: string
  overlayClassName?: string
  showHandle?: boolean
  showCloseButton?: boolean
  dismissible?: boolean
  snapPoints?: number[]
  defaultSnapPoint?: number
  maxHeight?: string
  onSnapPointChange?: (snapPoint: number) => void
}

const SNAP_THRESHOLD = 0.3
const VELOCITY_THRESHOLD = 500

export function BottomSheet({
  children,
  open,
  onOpenChange,
  title,
  description,
  className,
  contentClassName,
  overlayClassName,
  showHandle = true,
  showCloseButton = true,
  dismissible = true,
  snapPoints = [0.4, 0.8],
  defaultSnapPoint = 0.4,
  maxHeight = "90vh",
  onSnapPointChange,
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(defaultSnapPoint)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleClose = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  const handleDragEnd = React.useCallback((event: any, info: PanInfo) => {
    setIsDragging(false)
    
    if (!dismissible) return

    const velocity = info.velocity.y
    const offset = info.offset.y
    const sheetHeight = window.innerHeight * currentSnapPoint

    // Check if should dismiss completely
    if (velocity > VELOCITY_THRESHOLD || offset > sheetHeight * SNAP_THRESHOLD) {
      handleClose()
      return
    }

    // Find closest snap point
    const currentHeight = window.innerHeight * currentSnapPoint - offset
    const currentPercentage = currentHeight / window.innerHeight
    
    const closestSnapPoint = snapPoints.reduce((closest, point) => {
      return Math.abs(point - currentPercentage) < Math.abs(closest - currentPercentage) 
        ? point 
        : closest
    })

    if (closestSnapPoint !== currentSnapPoint) {
      setCurrentSnapPoint(closestSnapPoint)
      onSnapPointChange?.(closestSnapPoint)
    }
  }, [currentSnapPoint, snapPoints, dismissible, handleClose, onSnapPointChange])

  const handleDragStart = React.useCallback(() => {
    setIsDragging(true)
  }, [])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
                  overlayClassName
                )}
                onClick={dismissible ? handleClose : undefined}
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ 
                  y: `${100 - (currentSnapPoint * 100)}%`,
                }}
                exit={{ y: "100%" }}
                drag={dismissible ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.1 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                transition={{
                  type: "spring",
                  damping: isDragging ? 50 : 30,
                  stiffness: isDragging ? 300 : 400,
                  duration: isDragging ? 0 : 0.3
                }}
                className={cn(
                  "fixed bottom-0 left-0 right-0 z-50",
                  "bg-background border-t border-border rounded-t-lg shadow-lg",
                  "touch-pan-y",
                  className
                )}
                style={{ maxHeight }}
                data-testid="bottom-sheet"
              >
                {/* Handle */}
                {showHandle && (
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                )}

                {/* Header */}
                {(title || description || showCloseButton) && (
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 touch-target"
                        onClick={handleClose}
                        data-testid="bottom-sheet-close"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={cn(
                  "overflow-y-auto overscroll-contain",
                  contentClassName
                )}>
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export type { BottomSheetProps }