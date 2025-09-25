import { useEffect, useRef } from 'react'
import { useLocation } from 'wouter'

interface ScrollPosition {
  x: number
  y: number
  timestamp: number
}

const scrollPositions = new Map<string, ScrollPosition>()
const SCROLL_RESTORATION_KEY = 'scroll-restoration'
const MAX_AGE = 5 * 60 * 1000 // 5 minutes

export function useScrollRestoration(
  key?: string,
  dependencies: any[] = []
) {
  const [location] = useLocation()
  const scrollKey = key || location
  const containerRef = useRef<HTMLDivElement>(null)
  const isRestoringRef = useRef(false)

  // Save scroll position when component unmounts or dependencies change
  const saveScrollPosition = () => {
    if (containerRef.current && !isRestoringRef.current) {
      const container = containerRef.current
      const position: ScrollPosition = {
        x: container.scrollLeft,
        y: container.scrollTop,
        timestamp: Date.now()
      }
      scrollPositions.set(scrollKey, position)
      
      // Also persist to sessionStorage for page refreshes
      try {
        const positions = JSON.parse(
          sessionStorage.getItem(SCROLL_RESTORATION_KEY) || '{}'
        )
        positions[scrollKey] = position
        sessionStorage.setItem(SCROLL_RESTORATION_KEY, JSON.stringify(positions))
      } catch (error) {
        // Ignore storage errors
      }
    }
  }

  // Restore scroll position when component mounts
  const restoreScrollPosition = () => {
    if (containerRef.current) {
      let position = scrollPositions.get(scrollKey)
      
      // Fallback to sessionStorage if not in memory
      if (!position) {
        try {
          const positions = JSON.parse(
            sessionStorage.getItem(SCROLL_RESTORATION_KEY) || '{}'
          )
          position = positions[scrollKey]
        } catch (error) {
          // Ignore storage errors
        }
      }
      
      if (position && Date.now() - position.timestamp < MAX_AGE) {
        isRestoringRef.current = true
        const container = containerRef.current
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          container.scrollTo({
            left: position!.x,
            top: position!.y,
            behavior: 'auto' // Instant scroll for restoration
          })
          
          // Allow normal scroll tracking after restoration
          setTimeout(() => {
            isRestoringRef.current = false
          }, 100)
        })
      }
    }
  }

  // Clean up old positions
  const cleanupOldPositions = () => {
    const now = Date.now()
    
    // Clean memory
    for (const [key, position] of scrollPositions.entries()) {
      if (now - position.timestamp > MAX_AGE) {
        scrollPositions.delete(key)
      }
    }
    
    // Clean sessionStorage
    try {
      const positions = JSON.parse(
        sessionStorage.getItem(SCROLL_RESTORATION_KEY) || '{}'
      )
      const cleaned: Record<string, ScrollPosition> = {}
      
      for (const [key, position] of Object.entries(positions)) {
        if (position && now - (position as ScrollPosition).timestamp < MAX_AGE) {
          cleaned[key] = position as ScrollPosition
        }
      }
      
      sessionStorage.setItem(SCROLL_RESTORATION_KEY, JSON.stringify(cleaned))
    } catch (error) {
      // Ignore storage errors
    }
  }

  // Set up scroll tracking
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      if (isRestoringRef.current) return
      
      // Debounce scroll saving
      clearTimeout(timeoutId)
      timeoutId = setTimeout(saveScrollPosition, 150)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
      saveScrollPosition() // Save on cleanup
    }
  }, [scrollKey, ...dependencies])

  // Restore on mount and clean up old positions
  useEffect(() => {
    restoreScrollPosition()
    cleanupOldPositions()
  }, [scrollKey])

  // Save position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return {
    containerRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition: () => {
      scrollPositions.delete(scrollKey)
      try {
        const positions = JSON.parse(
          sessionStorage.getItem(SCROLL_RESTORATION_KEY) || '{}'
        )
        delete positions[scrollKey]
        sessionStorage.setItem(SCROLL_RESTORATION_KEY, JSON.stringify(positions))
      } catch (error) {
        // Ignore storage errors
      }
    }
  }
}

export default useScrollRestoration