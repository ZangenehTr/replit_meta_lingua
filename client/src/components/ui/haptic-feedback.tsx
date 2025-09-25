"use client"

import * as React from "react"

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

interface HapticFeedbackProps {
  children: React.ReactNode
  type?: HapticType
  disabled?: boolean
  className?: string
  onHaptic?: (type: HapticType) => void
}

const hapticPatterns = {
  light: 'haptic-light',
  medium: 'haptic-medium', 
  heavy: 'haptic-medium',
  selection: 'haptic-light',
  success: 'haptic-light',
  warning: 'haptic-medium',
  error: 'haptic-medium'
}

export function HapticFeedback({
  children,
  type = 'light',
  disabled = false,
  className,
  onHaptic,
}: HapticFeedbackProps) {
  const elementRef = React.useRef<HTMLElement>(null)

  const triggerHaptic = React.useCallback(() => {
    if (disabled) return

    // Trigger native haptic feedback if available (iOS Safari)
    if (typeof window !== 'undefined' && 'navigator' in window) {
      try {
        // @ts-ignore - Experimental API
        if (navigator.vibrate) {
          const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            selection: [5],
            success: [10, 5, 10],
            warning: [15, 10, 15],
            error: [20, 10, 20, 10, 20]
          }
          navigator.vibrate(patterns[type])
        }
      } catch (error) {
        // Ignore vibration errors
      }
    }

    // Visual feedback fallback
    if (elementRef.current) {
      elementRef.current.classList.add(hapticPatterns[type])
      
      const duration = type === 'light' || type === 'selection' ? 150 : 200
      setTimeout(() => {
        elementRef.current?.classList.remove(hapticPatterns[type])
      }, duration)
    }

    onHaptic?.(type)
  }, [disabled, type, onHaptic])

  return React.cloneElement(
    React.Children.only(children) as React.ReactElement,
    {
      ref: elementRef,
      onClick: (event: React.MouseEvent) => {
        triggerHaptic()
        ;(children as any)?.props?.onClick?.(event)
      },
      onTouchStart: (event: React.TouchEvent) => {
        triggerHaptic()
        ;(children as any)?.props?.onTouchStart?.(event)
      },
      className: className,
      'data-haptic': type
    }
  )
}

// Higher-order component for adding haptic feedback
export function withHapticFeedback<P extends object>(
  Component: React.ComponentType<P>,
  defaultType: HapticType = 'light'
) {
  return React.forwardRef<any, P & { hapticType?: HapticType; disableHaptic?: boolean }>((
    { hapticType = defaultType, disableHaptic = false, ...props },
    ref
  ) => (
    <HapticFeedback type={hapticType} disabled={disableHaptic}>
      <Component ref={ref} {...props as P} />
    </HapticFeedback>
  ))
}

// Hook for manual haptic triggering
export function useHapticFeedback() {
  return React.useCallback((type: HapticType = 'light') => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      try {
        // @ts-ignore - Experimental API
        if (navigator.vibrate) {
          const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            selection: [5],
            success: [10, 5, 10],
            warning: [15, 10, 15],
            error: [20, 10, 20, 10, 20]
          }
          navigator.vibrate(patterns[type])
        }
      } catch (error) {
        // Ignore vibration errors
      }
    }
  }, [])
}

export type { HapticType, HapticFeedbackProps }