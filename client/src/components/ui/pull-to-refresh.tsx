"use client"

import * as React from "react"
import { motion, PanInfo } from "framer-motion"
import { RefreshCw, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  disabled?: boolean
  threshold?: number
  className?: string
  refreshingText?: string
  pullText?: string
  releaseText?: string
  maxPullDistance?: number
}

const REFRESH_THRESHOLD = 80
const MAX_PULL_DISTANCE = 120

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = REFRESH_THRESHOLD,
  className,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
  maxPullDistance = MAX_PULL_DISTANCE,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [canRefresh, setCanRefresh] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handlePanStart = React.useCallback(() => {
    if (disabled || isRefreshing) return
    
    // Only allow pull-to-refresh when scrolled to top
    const container = containerRef.current
    if (container && container.scrollTop > 0) return
    
    setCanRefresh(true)
  }, [disabled, isRefreshing])

  const handlePan = React.useCallback((event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !canRefresh) return
    
    // Only allow downward movement
    if (info.delta.y < 0) return
    
    const distance = Math.min(info.offset.y, maxPullDistance)
    setPullDistance(Math.max(0, distance))
  }, [disabled, isRefreshing, canRefresh, maxPullDistance])

  const handlePanEnd = React.useCallback(async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !canRefresh) return
    
    setCanRefresh(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error("Error during refresh:", error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [disabled, isRefreshing, canRefresh, pullDistance, threshold, onRefresh])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const iconRotation = pullProgress * 180

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Pull-to-refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm border-b"
        animate={{
          height: pullDistance > 0 ? Math.min(pullDistance, 60) : 0,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ duration: 0.1 }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{refreshingText}</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: iconRotation }}
                transition={{ duration: 0.1 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              <span>
                {pullDistance >= threshold ? releaseText : pullText}
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.2, bottom: 0 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={{
          y: isRefreshing ? 60 : 0,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn(
          "min-h-full touch-pan-y",
          (pullDistance > 0 || isRefreshing) && "pointer-events-none"
        )}
      >
        {children}
      </motion.div>
    </div>
  )
}

export type { PullToRefreshProps }